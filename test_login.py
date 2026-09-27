import requests
import json

BASE_URL = "http://localhost:8080"

def test_login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    print(f"Login {email}: status={r.status_code}")
    if r.status_code == 200:
        data = r.json()
        token = data.get("data", {}).get("token")
        user = data.get("data", {}).get("user", {})
        print(f"  User: id={user.get('id')}, role={user.get('role')}, studentId={user.get('studentId')}")
        return token
    else:
        print(f"  Error: {r.text}")
        return None

admin_token = test_login("admin@school.com", "Admin@123")
teacher_token = test_login("teacher@school.com", "Teacher@123")
parent_token = test_login("parent@school.com", "Parent@123")
