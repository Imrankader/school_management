import os
import io
import requests
import openpyxl
from openpyxl import Workbook

BASE_URL = "http://localhost:8080"

def get_token(email, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["data"]["token"]

admin_token = get_token("admin@school.com", "Admin@123")
teacher_token = get_token("teacher@school.com", "Teacher@123")
parent_token = get_token("parent@school.com", "Parent@123")

admin_headers = {"Authorization": f"Bearer {admin_token}"}
teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
parent_headers = {"Authorization": f"Bearer {parent_token}"}

results = {}

# -------------------------------------------------------------
# TEST 1: Admin opens Marks
# -------------------------------------------------------------
print("\n--- TEST 1: Admin opens Marks ---")
r = requests.get(f"{BASE_URL}/api/academic/marks", headers=admin_headers)
print(f"Status: {r.status_code}")
assert r.status_code == 200, f"Admin marks access failed: {r.text}"
results["TEST 1 (Admin opens Marks)"] = "PASSED"
print("TEST 1 PASSED: Admin successfully accessed Marks.")

# -------------------------------------------------------------
# TEST 2: Teacher opens Marks
# -------------------------------------------------------------
print("\n--- TEST 2: Teacher opens Marks ---")
r = requests.get(f"{BASE_URL}/api/academic/marks", headers=teacher_headers)
print(f"Status: {r.status_code}")
assert r.status_code == 200, f"Teacher marks access failed: {r.text}"
results["TEST 2 (Teacher opens Marks)"] = "PASSED"
print("TEST 2 PASSED: Teacher successfully accessed Marks.")

# -------------------------------------------------------------
# TEST 3: Admin enters individual marks
# -------------------------------------------------------------
print("\n--- TEST 3: Admin enters individual marks ---")
payload_admin = {
    "studentId": 1,
    "admissionNumber": "10",
    "studentName": "Abder shaheen",
    "className": "Class 10",
    "section": "A",
    "examName": "Quarterly",
    "subjectName": "Mathematics",
    "marksObtained": 85.0,
    "maxMarks": 100.0,
    "remarks": "Good performance"
}
r = requests.post(f"{BASE_URL}/api/academic/marks", json=payload_admin, headers=admin_headers)
print(f"Status: {r.status_code}, Body: {r.json()}")
assert r.status_code in [200, 201], f"Admin mark entry failed: {r.text}"
saved_mark = r.json()["data"]
assert saved_mark["marksObtained"] == 85.0
assert saved_mark["grade"] == "A"
saved_mark_id = saved_mark["id"]
results["TEST 3 (Admin enters individual marks)"] = "PASSED"
print(f"TEST 3 PASSED: Admin recorded mark ID {saved_mark_id} (85/100, Grade A).")

# -------------------------------------------------------------
# TEST 4: Teacher edits marks
# -------------------------------------------------------------
print("\n--- TEST 4: Teacher edits marks ---")
# Edit 85 -> 90 using Teacher token
update_payload = {
    "marksObtained": 90.0,
    "maxMarks": 100.0,
    "remarks": "Excellent improvement after revision"
}
r = requests.put(f"{BASE_URL}/api/academic/marks/{saved_mark_id}", json=update_payload, headers=teacher_headers)
print(f"Status: {r.status_code}, Body: {r.json()}")
assert r.status_code == 200, f"Teacher mark edit failed: {r.text}"
updated_mark = r.json()["data"]
assert updated_mark["id"] == saved_mark_id
assert updated_mark["marksObtained"] == 90.0
assert updated_mark["grade"] == "A+"

# Verify no duplicate was created
r_check = requests.get(f"{BASE_URL}/api/academic/marks", params={
    "className": "Class 10",
    "section": "A",
    "examName": "Quarterly",
    "subjectName": "Mathematics"
}, headers=admin_headers)
matches = [m for m in r_check.json()["data"] if m["studentId"] == 1]
print(f"Number of matching records for Student 1: {len(matches)}")
assert len(matches) == 1, f"Expected 1 record, found {len(matches)}"
assert matches[0]["marksObtained"] == 90.0
results["TEST 4 (Teacher edits marks)"] = "PASSED"
print("TEST 4 PASSED: Mark updated to 90.0 (Grade A+), no duplicates created.")

# Helper to build Excel file in memory
def create_excel_bytes(headers, rows):
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio.getvalue()

def get_success(d): return d.get('successfulRows', d.get('successful', 0))
def get_updated(d): return d.get('updatedRows', d.get('updated', 0))
def get_failed(d): return d.get('failedRows', d.get('failed', 0))

# -------------------------------------------------------------
# TEST 5: Upload Class 10-only Excel
# -------------------------------------------------------------
print("\n--- TEST 5: Upload Class 10-only Excel (Class-Wise Mode) ---")
headers_classwise = ["Admission No", "Student Name", "Class", "Section", "Marks"]
rows_classwise = [
    ["10", "Abder shaheen", "10", "A", 88],
    ["800", "ragunandhan", "10", "A", 92]
]
excel_bytes = create_excel_bytes(headers_classwise, rows_classwise)
files = {"file": ("class10_marks.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
data_params = {
    "mode": "CLASS_WISE",
    "className": "Class 10",
    "section": "A",
    "examName": "Half Yearly",
    "subjectName": "Mathematics"
}
r = requests.post(f"{BASE_URL}/api/academic/marks/bulk-upload", files=files, data=data_params, headers=admin_headers)
print(f"Status: {r.status_code}, Body: {r.json()}")
assert r.status_code == 200
bulk_res = r.json()["data"]
print(f"Total: {bulk_res['totalRows']}, Success/Updated: {get_success(bulk_res) + get_updated(bulk_res)}, Failed: {get_failed(bulk_res)}")
assert get_failed(bulk_res) == 0, f"Expected 0 failures, got {get_failed(bulk_res)}: {bulk_res.get('errors')}"
assert (get_success(bulk_res) + get_updated(bulk_res)) == 2
results["TEST 5 (Upload Class 10-only Excel)"] = "PASSED"
print("TEST 5 PASSED: Class 10 marks successfully imported.")

# -------------------------------------------------------------
# TEST 6: Upload Excel containing Class 10-A, 10-B, 12-A, 12-B in ONE file
# -------------------------------------------------------------
print("\n--- TEST 6: Whole-School Mixed-Class Bulk Upload (10-A, 10-B, 12-A, 12-B) ---")
headers_mixed = ["Admission No", "Student", "Class", "Section", "Subject", "Exam", "Marks"]
rows_mixed = [
    ["10", "Abder shaheen", "10", "A", "Mathematics", "Quarterly", 85],
    ["RN-6089", "shahul hameed", "10", "B", "Science", "Quarterly", 78],
    ["12001", "Ravi Kumar", "12", "A", "Physics", "Quarterly", 91],
    ["10101010", "Aiyan Raj", "12", "B", "Mathematics", "Quarterly", 88]
]
excel_bytes = create_excel_bytes(headers_mixed, rows_mixed)
files = {"file": ("mixed_school_marks.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
data_params = {"mode": "WHOLE_SCHOOL"}
r = requests.post(f"{BASE_URL}/api/academic/marks/bulk-upload", files=files, data=data_params, headers=admin_headers)
print(f"Status: {r.status_code}, Body: {r.json()}")
assert r.status_code == 200
bulk_res = r.json()["data"]
print(f"Total: {bulk_res['totalRows']}, Success: {get_success(bulk_res)}, Updated: {get_updated(bulk_res)}, Failed: {get_failed(bulk_res)}")
assert bulk_res["totalRows"] == 4
assert get_failed(bulk_res) == 0, f"Errors encountered: {bulk_res.get('errors')}"
results["TEST 6 (Mixed-Class Bulk Upload 10-A, 10-B, 12-A, 12-B)"] = "PASSED"
print("TEST 6 PASSED: All 4 classes/sections automatically mapped and saved in ONE file.")

# -------------------------------------------------------------
# TEST 7: Upload Excel with wrong class
# -------------------------------------------------------------
print("\n--- TEST 7: Upload Excel with wrong class ---")
rows_wrong_class = [
    ["10", "Abder shaheen", "12", "B", "Mathematics", "Quarterly", 85]
]
excel_bytes = create_excel_bytes(headers_mixed, rows_wrong_class)
files = {"file": ("wrong_class.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
r = requests.post(f"{BASE_URL}/api/academic/marks/bulk-upload", files=files, data={"mode": "WHOLE_SCHOOL"}, headers=admin_headers)
bulk_res = r.json()["data"]
print(f"Failed rows: {get_failed(bulk_res)}, Errors: {bulk_res.get('errors')}")
assert get_failed(bulk_res) == 1
assert any("Invalid Class" in e["issue"] for e in bulk_res["errors"])

# Verify student's actual class in student-service remains unchanged
stu_r = requests.get(f"{BASE_URL}/api/students/1", headers=admin_headers)
stu_data = stu_r.json()["data"]
print(f"Student 1 actual class: {stu_data['className']} - {stu_data['section']}")
assert "10" in stu_data["className"]
assert stu_data["section"] == "A"
results["TEST 7 (Wrong Class Validation)"] = "PASSED"
print("TEST 7 PASSED: Rejected with 'Invalid Class'. Student class was NOT modified.")

# -------------------------------------------------------------
# TEST 8: Upload Excel with wrong section
# -------------------------------------------------------------
print("\n--- TEST 8: Upload Excel with wrong section ---")
rows_wrong_section = [
    ["10", "Abder shaheen", "10", "B", "Mathematics", "Quarterly", 85]
]
excel_bytes = create_excel_bytes(headers_mixed, rows_wrong_section)
files = {"file": ("wrong_section.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
r = requests.post(f"{BASE_URL}/api/academic/marks/bulk-upload", files=files, data={"mode": "WHOLE_SCHOOL"}, headers=admin_headers)
bulk_res = r.json()["data"]
print(f"Failed rows: {get_failed(bulk_res)}, Errors: {bulk_res.get('errors')}")
assert get_failed(bulk_res) == 1
assert any("Invalid Section" in e["issue"] for e in bulk_res["errors"])
results["TEST 8 (Wrong Section Validation)"] = "PASSED"
print("TEST 8 PASSED: Rejected with 'Invalid Section'.")

# -------------------------------------------------------------
# TEST 9: Upload Excel with invalid subject
# -------------------------------------------------------------
print("\n--- TEST 9: Upload Excel with invalid subject ---")
rows_invalid_subject = [
    ["10", "Abder shaheen", "10", "A", "AstrologyAndMythology", "Quarterly", 85]
]
excel_bytes = create_excel_bytes(headers_mixed, rows_invalid_subject)
files = {"file": ("invalid_subject.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
r = requests.post(f"{BASE_URL}/api/academic/marks/bulk-upload", files=files, data={"mode": "WHOLE_SCHOOL"}, headers=admin_headers)
bulk_res = r.json()["data"]
print(f"Failed rows: {get_failed(bulk_res)}, Errors: {bulk_res.get('errors')}")
assert get_failed(bulk_res) == 1
assert any("Invalid Subject" in e["issue"] for e in bulk_res["errors"])
results["TEST 9 (Invalid Subject Validation)"] = "PASSED"
print("TEST 9 PASSED: Rejected with 'Invalid Subject'.")

# -------------------------------------------------------------
# TEST 10: Upload Excel with invalid exam
# -------------------------------------------------------------
print("\n--- TEST 10: Upload Excel with invalid exam ---")
rows_invalid_exam = [
    ["10", "Abder shaheen", "10", "A", "Mathematics", "RandomFakeExam", 85]
]
excel_bytes = create_excel_bytes(headers_mixed, rows_invalid_exam)
files = {"file": ("invalid_exam.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
r = requests.post(f"{BASE_URL}/api/academic/marks/bulk-upload", files=files, data={"mode": "WHOLE_SCHOOL"}, headers=admin_headers)
bulk_res = r.json()["data"]
print(f"Failed rows: {get_failed(bulk_res)}, Errors: {bulk_res.get('errors')}")
assert get_failed(bulk_res) == 1
assert any("Invalid Exam" in e["issue"] for e in bulk_res["errors"])
results["TEST 10 (Invalid Exam Validation)"] = "PASSED"
print("TEST 10 PASSED: Rejected with 'Invalid Exam'.")

# -------------------------------------------------------------
# TEST 11: Upload duplicate (upsert handling)
# -------------------------------------------------------------
print("\n--- TEST 11: Duplicate Mark Upload Handling ---")
rows_duplicate = [
    ["10", "Abder shaheen", "10", "A", "Mathematics", "Quarterly", 95]
]
excel_bytes = create_excel_bytes(headers_mixed, rows_duplicate)
files = {"file": ("duplicate_upsert.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
r = requests.post(f"{BASE_URL}/api/academic/marks/bulk-upload", files=files, data={"mode": "WHOLE_SCHOOL"}, headers=admin_headers)
bulk_res = r.json()["data"]
print(f"Updated rows: {get_updated(bulk_res)}, Successful: {get_success(bulk_res)}, Failed: {get_failed(bulk_res)}")
assert get_updated(bulk_res) == 1
assert get_failed(bulk_res) == 0

# Check that mark is now 95 and there is only ONE record
r_verify = requests.get(f"{BASE_URL}/api/academic/marks", params={
    "className": "Class 10",
    "section": "A",
    "examName": "Quarterly",
    "subjectName": "Mathematics"
}, headers=admin_headers)
records = [m for m in r_verify.json()["data"] if m["studentId"] == 1]
print(f"Records found: {len(records)}, Marks: {records[0]['marksObtained']}")
assert len(records) == 1, "Duplicate record was created!"
assert records[0]["marksObtained"] == 95.0
results["TEST 11 (Duplicate Upsert Handling)"] = "PASSED"
print("TEST 11 PASSED: Mark updated to 95.0, exactly 1 record retained (no duplicates).")

# -------------------------------------------------------------
# TEST 12: Parent opens Marks
# -------------------------------------------------------------
print("\n--- TEST 12: Parent opens Marks ---")
# Parent of student 1 (Abder shaheen) calls /api/academic/marks/student/1
r_parent = requests.get(f"{BASE_URL}/api/academic/marks/student/1", headers=parent_headers)
print(f"Parent accessing linked child marks status: {r_parent.status_code}")
assert r_parent.status_code == 200
parent_marks = r_parent.json()["data"]
print(f"Number of marks for linked child: {len(parent_marks)}")
assert len(parent_marks) > 0
for m in parent_marks:
    assert m["studentId"] == 1

# Parent attempts to access another student's marks (student 2)
r_parent_unauth = requests.get(f"{BASE_URL}/api/academic/marks/student/2", headers=parent_headers)
print(f"Parent accessing unlinked child marks status: {r_parent_unauth.status_code}")
assert r_parent_unauth.status_code == 403, f"Expected 403 Forbidden, got {r_parent_unauth.status_code}"
results["TEST 12 (Parent Marks Isolation)"] = "PASSED"
print("TEST 12 PASSED: Parent can only view linked child's marks; 403 Forbidden for other students.")

# -------------------------------------------------------------
# TEST 13: Teacher/Admin view marks
# -------------------------------------------------------------
print("\n--- TEST 13: Teacher/Admin view marks with filters ---")
r_view = requests.get(f"{BASE_URL}/api/academic/marks", params={
    "className": "Class 10",
    "section": "A",
    "examName": "Quarterly",
    "subjectName": "Mathematics"
}, headers=teacher_headers)
print(f"Status: {r_view.status_code}")
assert r_view.status_code == 200
filtered = r_view.json()["data"]
print(f"Found {len(filtered)} filtered records")
for m in filtered:
    assert "10" in m["className"]
    assert m["section"] == "A"
    assert m["examName"] == "Quarterly"
    assert m["subjectName"] == "Mathematics"
results["TEST 13 (Filtering Marks View)"] = "PASSED"
print("TEST 13 PASSED: Filtering by class, section, exam, and subject works accurately.")

print("\n" + "="*50)
print("ALL TESTS SUMMARY:")
print("="*50)
for k, v in results.items():
    print(f"{k}: {v}")
print("="*50)
