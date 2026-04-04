import asyncio
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.models import Task, User, UserSetting, ReminderLog

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.SMTP_USER:
        logger.info(f"[EMAIL STUB] To: {to} | Subject: {subject}")
        return True
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


async def check_and_send_reminders():
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        # Find tasks with remind_at_start=True, start > now (within next 15 min)
        from datetime import timedelta
        window_end = now + timedelta(minutes=15)

        result = await db.execute(
            select(Task).where(
                Task.remind_at_start == True,
                Task.is_deleted == False,
                Task.start_datetime > now,
                Task.start_datetime <= window_end,
            )
        )
        tasks = result.scalars().all()

        for task in tasks:
            # Check if already sent
            log_result = await db.execute(
                select(ReminderLog).where(
                    ReminderLog.task_id == task.id,
                    ReminderLog.sent_at >= now - timedelta(minutes=15),
                )
            )
            if log_result.scalar_one_or_none():
                continue

            # Get user
            user_result = await db.execute(select(User).where(User.id == task.creator_id))
            user = user_result.scalar_one_or_none()
            if not user or not user.email:
                continue

            subject = f"Reminder: {task.description}"
            body = f"""
            <h2>Task Reminder</h2>
            <p><strong>{task.description}</strong></p>
            <p>Starts at: {task.start_datetime.strftime('%Y-%m-%d %H:%M UTC')}</p>
            """
            sent = await send_email(user.email, subject, body)
            if sent:
                db.add(ReminderLog(task_id=task.id, method="email"))
                await db.commit()
                logger.info(f"Sent reminder for task {task.id} to {user.email}")


async def reminder_loop():
    while True:
        try:
            await check_and_send_reminders()
        except Exception as e:
            logger.error(f"Reminder check error: {e}")
        await asyncio.sleep(settings.REMINDER_CHECK_INTERVAL)
