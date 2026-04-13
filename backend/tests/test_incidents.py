import pytest
from datetime import datetime, timezone, timedelta


def utc_iso(dt: datetime) -> str:
    return dt.isoformat()


@pytest.mark.asyncio
async def test_create_incident(client, auth_headers):
    start = datetime.now(timezone.utc) - timedelta(hours=2)
    end = datetime.now(timezone.utc) - timedelta(hours=1)

    resp = await client.post(
        "/api/v1/incidents",
        json={
            "start_datetime": utc_iso(start),
            "end_datetime": utc_iso(end),
            "description": "Network outage",
            "actions_taken": "Restarted router and switched uplink",
            "importance": 4,
        },
        headers=auth_headers,
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["description"] == "Network outage"
    assert data["importance"] == 4


@pytest.mark.asyncio
async def test_list_update_delete_incident(client, auth_headers):
    start = datetime.now(timezone.utc) - timedelta(days=1, hours=3)
    end = start + timedelta(hours=1)

    create_resp = await client.post(
        "/api/v1/incidents",
        json={
            "start_datetime": utc_iso(start),
            "end_datetime": utc_iso(end),
            "description": "Door lock issue",
            "actions_taken": "Temporary latch fix",
            "importance": 2,
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    incident_id = create_resp.json()["id"]

    list_resp = await client.get("/api/v1/incidents", headers=auth_headers)
    assert list_resp.status_code == 200
    incidents = list_resp.json()
    assert any(i["id"] == incident_id for i in incidents)

    update_resp = await client.put(
        f"/api/v1/incidents/{incident_id}",
        json={"importance": 5, "actions_taken": "Permanent lock replacement"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["importance"] == 5

    delete_resp = await client.delete(f"/api/v1/incidents/{incident_id}", headers=auth_headers)
    assert delete_resp.status_code == 200

    list_resp_after = await client.get("/api/v1/incidents", headers=auth_headers)
    assert all(i["id"] != incident_id for i in list_resp_after.json())


@pytest.mark.asyncio
async def test_create_incident_validates_time_range(client, auth_headers):
    start = datetime.now(timezone.utc)
    end = start - timedelta(minutes=1)

    resp = await client.post(
        "/api/v1/incidents",
        json={
            "start_datetime": utc_iso(start),
            "end_datetime": utc_iso(end),
            "description": "Invalid",
            "actions_taken": "None",
            "importance": 3,
        },
        headers=auth_headers,
    )

    assert resp.status_code == 422

