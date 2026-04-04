import pytest


@pytest.mark.asyncio
async def test_create_goal(client, auth_headers):
    resp = await client.post(
        "/api/v1/goals",
        json={"description": "Learn Spanish", "activity_ids": []},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["description"] == "Learn Spanish"
    assert data["progress"] == 0.0
    assert data["activity_count"] == 0


@pytest.mark.asyncio
async def test_goal_progress_with_activities(client, auth_headers):
    # Create 2 activities
    act1 = await client.post(
        "/api/v1/activities",
        json={"description": "Activity 1", "color": "#ff0000", "priority": 5},
        headers=auth_headers,
    )
    act2 = await client.post(
        "/api/v1/activities",
        json={"description": "Activity 2", "color": "#00ff00", "priority": 5},
        headers=auth_headers,
    )
    act1_id = act1.json()["id"]
    act2_id = act2.json()["id"]

    # Create goal with both activities
    goal_resp = await client.post(
        "/api/v1/goals",
        json={"description": "Goal with activities", "activity_ids": [act1_id, act2_id]},
        headers=auth_headers,
    )
    goal_id = goal_resp.json()["id"]
    assert goal_resp.json()["activity_count"] == 2
    assert goal_resp.json()["progress"] == 0.0

    # Complete one activity
    await client.put(
        f"/api/v1/activities/{act1_id}",
        json={"completed": True},
        headers=auth_headers,
    )

    # Re-fetch goal
    goals = await client.get("/api/v1/goals", headers=auth_headers)
    goal = next(g for g in goals.json() if g["id"] == goal_id)
    assert goal["progress"] == 50.0


@pytest.mark.asyncio
async def test_goal_visible_only_to_owner(client):
    # Create two separate users
    await client.post("/api/v1/auth/register", json={"username": "goal_owner", "password": "pass1"})
    await client.post("/api/v1/auth/register", json={"username": "goal_other", "password": "pass2"})

    resp1 = await client.post("/api/v1/auth/login", data={"username": "goal_owner", "password": "pass1"})
    resp2 = await client.post("/api/v1/auth/login", data={"username": "goal_other", "password": "pass2"})

    headers1 = {"Authorization": f"Bearer {resp1.json()['access_token']}"}
    headers2 = {"Authorization": f"Bearer {resp2.json()['access_token']}"}

    await client.post("/api/v1/goals", json={"description": "Private goal"}, headers=headers1)

    goals_user2 = await client.get("/api/v1/goals", headers=headers2)
    descriptions = [g["description"] for g in goals_user2.json()]
    assert "Private goal" not in descriptions


@pytest.mark.asyncio
async def test_update_goal(client, auth_headers):
    resp = await client.post("/api/v1/goals", json={"description": "Old desc"}, headers=auth_headers)
    goal_id = resp.json()["id"]
    update = await client.put(f"/api/v1/goals/{goal_id}", json={"description": "New desc"}, headers=auth_headers)
    assert update.json()["description"] == "New desc"


@pytest.mark.asyncio
async def test_delete_goal(client, auth_headers):
    resp = await client.post("/api/v1/goals", json={"description": "To delete goal"}, headers=auth_headers)
    goal_id = resp.json()["id"]
    del_resp = await client.delete(f"/api/v1/goals/{goal_id}", headers=auth_headers)
    assert del_resp.status_code == 200
