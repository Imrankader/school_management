import requests

BASE_URL = "http://localhost:8080"

token = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@school.com", "password": "Admin@123"}).json()["data"]["token"]
headers = {"Authorization": f"Bearer {token}"}

# Fetch students from student service
stuRes = requests.get(f"{BASE_URL}/api/students", params={"pageSize": 1000}, headers=headers).json()

# Mimic the exact frontend extraction logic in MarksPage.jsx
rawStudents = []
if isinstance(stuRes, list):
    rawStudents = stuRes
elif isinstance(stuRes.get("data", {}), dict) and isinstance(stuRes["data"].get("data"), list):
    rawStudents = stuRes["data"]["data"]
elif isinstance(stuRes.get("data"), list):
    rawStudents = stuRes["data"]
elif isinstance(stuRes.get("students"), list):
    rawStudents = stuRes["students"]

print(f"Extracted {len(rawStudents)} students from API response.")
assert len(rawStudents) > 0, "No students extracted!"

def normalize_class(cls):
    if not cls: return ""
    import re
    return re.sub(r'(?i)^class\s*', '', str(cls).strip()).strip().lower()

def normalize_section(sec):
    if not sec: return ""
    import re
    return re.sub(r'(?i)^section\s*', '', str(sec).strip()).strip().upper()

def filter_students(entry_class, entry_section):
    target_class_norm = normalize_class(entry_class)
    target_sec_norm = normalize_section(entry_section)
    result = []
    for s in rawStudents:
        if s.get("isActive") is False:
            continue
        if target_class_norm:
            s_class_norm = normalize_class(s.get("className"))
            if s_class_norm != target_class_norm:
                continue
        if target_sec_norm:
            s_sec_norm = normalize_section(s.get("section"))
            if s_sec_norm and s_sec_norm != target_sec_norm:
                continue
        result.append(s)
    return result

print("\n--- TEST COMBINATION 1: Class 10 + Section A ---")
res1 = filter_students("10", "A")
print(f"Students in Class 10 - A (count={len(res1)}):")
for s in res1:
    print(f"  {s['admissionNumber']} | {s['name']} | Class={s['className']} | Sec={s['section']}")
assert len(res1) >= 2, f"Expected at least 2 students, got {len(res1)}"
adm_numbers = [s["admissionNumber"] for s in res1]
assert "10" in adm_numbers, "Student 10 (Abder shaheen) missing!"
assert "800" in adm_numbers, "Student 800 (ragunandhan) missing!"
print("COMBINATION 1 PASSED: Correct students loaded.")

print("\n--- TEST COMBINATION 2: Class 10 + Section B ---")
res2 = filter_students("10", "B")
print(f"Students in Class 10 - B (count={len(res2)}):")
for s in res2:
    print(f"  {s['admissionNumber']} | {s['name']} | Class={s['className']} | Sec={s['section']}")
assert len(res2) == 1
assert res2[0]["admissionNumber"] == "RN-6089"
print("COMBINATION 2 PASSED: shahul hameed loaded.")

print("\n--- TEST COMBINATION 3: Class 12 + Section A ---")
res3 = filter_students("Class 12", "A")
print(f"Students in Class 12 - A (count={len(res3)}):")
for s in res3:
    print(f"  {s['admissionNumber']} | {s['name']} | Class={s['className']} | Sec={s['section']}")
assert len(res3) == 1
assert res3[0]["admissionNumber"] == "12001"
print("COMBINATION 3 PASSED: Ravi Kumar loaded.")

print("\n--- TEST COMBINATION 4: Class 7 + Section A (No students) ---")
res4 = filter_students("Class 7", "A")
print(f"Students in Class 7 - A (count={len(res4)}): {res4}")
assert len(res4) == 0
print("COMBINATION 4 PASSED: Cleanly returns 0 students without errors.")

print("\nALL COMBINATION TESTS COMPLETED SUCCESSFULLY!")
