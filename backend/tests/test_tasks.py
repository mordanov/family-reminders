import pytest
from datetime import datetime, timezone, timedelta


def utc_iso(dt: datetime) -> str:
    return dt.isoformat()


@pytest.mark.asyncio
async def test_create_task(client, auth_headers):
    start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    end = start + timedelta(hours=1)
    resp = await client.post(
        "/api/v1/tasks",
        json={
            "start_datetime": utc_iso(start),
            "end_datetime": utc_iso(end),
            "description": "Test task",
            "color": "#ff0000",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["description"] == "Test task"
    assert data["is_recurring"] is False


@pytest.mark.asyncio
async def test_create_recurring_task(client, auth_headers):
    start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=2)
    end = start + timedelta(hours=1)
    resp = await client.post(
        "/api/v1/tasks",
        json={
            "start_datetime": utc_iso(start),
            "end_datetime": utc_iso(end),
            "description": "Daily standup",
            "color": "#0000ff",
            "is_recurring": True,
            "recurring_rule": {"frequency": "daily", "interval": 1},
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_recurring"] is True
    assert data["recurring_rule"]["frequency"] == "daily"
    assert data["recurring_rule"]["end_date"] is not None


@pytest.mark.asyncio
async def test_get_today_tasks(client, auth_headers):
    resp = await client.get("/api/v1/tasks/today", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_reminders_only_future(client, auth_headers):
    # Task with remind_at_start, starting in 5 minutes — should appear
    start_future = datetime.now(timezone.utc) + timedelta(minutes=5)
    end_future = start_future + timedelta(hours=1)
    await client.post(
        "/api/v1/tasks",
        json={
            "start_datetime": utc_iso(start_future),
            "end_datetime": utc_iso(end_future),
            "description": "Future reminder task",
            "remind_at_start": True,
            "color": "#00ff00",
        },
        headers=auth_headers,
    )

    # Task that has already started — should NOT appear in reminders
    start_past = datetime.now(timezone.utc) - timedelta(minutes=30)
    end_past = start_past + timedelta(hours=1)
    await client.post(
        "/api/v1/tasks",
        json={
            "start_datetime": utc_iso(start_past),
            "end_datetime": utc_iso(end_past),
            "description": "Past reminder task",
            "remind_at_start": True,
            "color": "#ff0000",
        },
        headers=auth_headers,
    )

    resp = await client.get("/api/v1/tasks/reminders", headers=auth_headers)
    assert resp.status_code == 200
    reminders = resp.json()
    descriptions = [r["description"] for r in reminders]
    assert "Future reminder task" in descriptions
    assert "Past reminder task" not in descriptions


@pytest.mark.asyncio
async def test_update_task(client, auth_headers):
    start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=3)
    end = start + timedelta(hours=1)
    create_resp = await client.post(
        "/api/v1/tasks",
        json={"start_datetime": utc_iso(start), "end_datetime": utc_iso(end), "description": "Original", "color": "#aaaaaa"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]
    update_resp = await client.put(
        f"/api/v1/tasks/{task_id}",
        json={"description": "Updated"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["description"] == "Updated"


@pytest.mark.asyncio
async def test_delete_task(client, auth_headers):
    start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=4)
    end = start + timedelta(hours=1)
    create_resp = await client.post(
        "/api/v1/tasks",
        json={"start_datetime": utc_iso(start), "end_datetime": utc_iso(end), "description": "To delete", "color": "#bbbbbb"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]
    del_resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert del_resp.status_code == 200
