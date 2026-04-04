import pytest


@pytest.mark.asyncio
async def test_register(client):
    resp = await client.post("/api/v1/auth/register", json={"username": "newuser", "password": "newpass"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "newuser"


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/v1/auth/register", json={"username": "loginuser", "password": "pass123"})
    resp = await client.post("/api/v1/auth/login", data={"username": "loginuser", "password": "pass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/v1/auth/register", json={"username": "baduser", "password": "correct"})
    resp = await client.post("/api/v1/auth/login", data={"username": "baduser", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me(client, auth_headers):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "testuser"


@pytest.mark.asyncio
async def test_me_unauthorized(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_register(client):
    await client.post("/api/v1/auth/register", json={"username": "dupuser", "password": "pass"})
    resp = await client.post("/api/v1/auth/register", json={"username": "dupuser", "password": "pass"})
    assert resp.status_code == 400
