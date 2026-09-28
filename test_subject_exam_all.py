import requests
import json
import sys

BASE_URL = "http://localhost:8080"

# Step 0: Login as Admin
login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@school.com", "password": "Admin@123"})
if login_res.status_code != 200 or not login_res.json().get('success'):
    print("FAILED: Admin login failed", login_res.text)
    sys.exit(1)

token = login_res.json()['data']['token']
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("[PASS] 0. Admin Login successful")

# Test 1: Add Subject
test_sub_name = "Robotics & AI"
test_sub_code = "ROB-101"
add_sub_res = requests.post(f"{BASE_URL}/api/academic/subjects", headers=headers, json={
    "name": test_sub_name,
    "code": test_sub_code
})
assert add_sub_res.status_code in [200, 201], f"Add subject failed: {add_sub_res.text}"
sub_data = add_sub_res.json()['data']
sub_id = sub_data['id']
print(f"[PASS] 1. Add Subject: created ID={sub_id}, name='{sub_data['name']}', code='{sub_data['code']}'")

# Test 1.1: Duplicate Subject Name Check
dup_name_res = requests.post(f"{BASE_URL}/api/academic/subjects", headers=headers, json={
    "name": test_sub_name.lower(), # case-insensitive check
    "code": "ROB-999"
})
assert dup_name_res.status_code in [400, 409], f"Expected 409/400 for duplicate subject name, got {dup_name_res.status_code}: {dup_name_res.text}"
print(f"[PASS] 1.1. Subject duplicate name prevented: {dup_name_res.json().get('message')}")

# Test 1.2: Duplicate Subject Code Check
dup_code_res = requests.post(f"{BASE_URL}/api/academic/subjects", headers=headers, json={
    "name": "Different Subject Name",
    "code": test_sub_code.lower() # case-insensitive check
})
assert dup_code_res.status_code in [400, 409], f"Expected 409/400 for duplicate subject code, got {dup_code_res.status_code}: {dup_code_res.text}"
print(f"[PASS] 1.2. Subject duplicate code prevented: {dup_code_res.json().get('message')}")

# Test 2: Edit Subject
edit_sub_name = "Advanced Robotics"
edit_sub_code = "ADV-ROB-101"
edit_sub_res = requests.put(f"{BASE_URL}/api/academic/subjects/{sub_id}", headers=headers, json={
    "name": edit_sub_name,
    "code": edit_sub_code
})
assert edit_sub_res.status_code == 200, f"Edit subject failed: {edit_sub_res.text}"
print(f"[PASS] 2. Edit Subject: updated ID={sub_id}")

# Test 3: Verify updated Subject appears in list
get_subs_res = requests.get(f"{BASE_URL}/api/academic/subjects", headers=headers)
assert get_subs_res.status_code == 200
all_subs = get_subs_res.json()['data']
matching_sub = next((s for s in all_subs if s['id'] == sub_id), None)
assert matching_sub is not None, f"Subject {sub_id} not found in subjects list"
assert matching_sub['name'] == edit_sub_name, f"Expected name {edit_sub_name}, got {matching_sub['name']}"
assert matching_sub['code'] == edit_sub_code, f"Expected code {edit_sub_code}, got {matching_sub['code']}"
print(f"[PASS] 3. Verify updated Subject in list: found ID={sub_id}, name='{matching_sub['name']}', code='{matching_sub['code']}'")

# Test 4: Delete unused Subject
del_sub_res = requests.delete(f"{BASE_URL}/api/academic/subjects/{sub_id}", headers=headers)
assert del_sub_res.status_code == 200, f"Delete subject failed: {del_sub_res.text}"
get_subs_res_after = requests.get(f"{BASE_URL}/api/academic/subjects", headers=headers)
assert not any(s['id'] == sub_id for s in get_subs_res_after.json()['data']), "Deleted subject still present!"
print(f"[PASS] 4. Delete unused Subject: successfully removed ID={sub_id}")

# Test 5: Try deleting Subject that has marks (e.g. Mathematics ID=8 or mathemetics ID=1)
# Find subject used in marks
marks_res = requests.get(f"{BASE_URL}/api/academic/marks", headers=headers)
marks = marks_res.json()['data']
used_subject_ids = [m['subjectId'] for m in marks if m.get('subjectId')]
assert len(used_subject_ids) > 0, "No marks found with subjectId to test dependency protection!"
target_sub_id = used_subject_ids[0]
sub_to_delete = next((s for s in all_subs if s['id'] == target_sub_id), None)
assert sub_to_delete is not None

del_blocked_res = requests.delete(f"{BASE_URL}/api/academic/subjects/{target_sub_id}", headers=headers)
assert del_blocked_res.status_code == 409, f"Expected 409 CONFLICT when deleting subject with marks, got {del_blocked_res.status_code}: {del_blocked_res.text}"
err_msg = del_blocked_res.json().get('message', '')
assert "cannot be deleted because marks already exist" in err_msg, f"Unexpected error message: {err_msg}"
print(f"[PASS] 5. Try deleting Subject with marks: correctly BLOCKED with 409. Message: '{err_msg}'")

# Test 6: Add Exam
test_exam_name = "Unit Assessment 1"
test_exam_date = "2026-11-10"
test_exam_total = 75
add_exam_res = requests.post(f"{BASE_URL}/api/academic/exams", headers=headers, json={
    "name": test_exam_name,
    "examDate": test_exam_date,
    "totalMarks": test_exam_total
})
assert add_exam_res.status_code in [200, 201], f"Add exam failed: {add_exam_res.text}"
exam_data = add_exam_res.json()['data']
exam_id = exam_data['id']
print(f"[PASS] 6. Add Exam: created ID={exam_id}, name='{exam_data['name']}', totalMarks={exam_data['totalMarks']}")

# Test 6.1: Duplicate Exam Name Check
dup_exam_res = requests.post(f"{BASE_URL}/api/academic/exams", headers=headers, json={
    "name": test_exam_name.lower(),
    "examDate": "2026-12-01",
    "totalMarks": 100
})
assert dup_exam_res.status_code in [400, 409], f"Expected 409/400 for duplicate exam name, got {dup_exam_res.status_code}: {dup_exam_res.text}"
print(f"[PASS] 6.1. Exam duplicate name prevented: {dup_exam_res.json().get('message')}")

# Test 7: Edit Exam
edit_exam_name = "Unit Assessment 1 (Revised)"
edit_exam_date = "2026-11-15"
edit_exam_total = 80
edit_exam_res = requests.put(f"{BASE_URL}/api/academic/exams/{exam_id}", headers=headers, json={
    "name": edit_exam_name,
    "examDate": edit_exam_date,
    "totalMarks": edit_exam_total
})
assert edit_exam_res.status_code == 200, f"Edit exam failed: {edit_exam_res.text}"
print(f"[PASS] 7. Edit Exam: updated ID={exam_id}")

# Test 8: Verify updated Exam appears in list
get_exams_res = requests.get(f"{BASE_URL}/api/academic/exams", headers=headers)
assert get_exams_res.status_code == 200
all_exams = get_exams_res.json()['data']
matching_exam = next((e for e in all_exams if e['id'] == exam_id), None)
assert matching_exam is not None, f"Exam {exam_id} not found in exams list"
assert matching_exam['name'] == edit_exam_name, f"Expected name {edit_exam_name}, got {matching_exam['name']}"
assert matching_exam['totalMarks'] == edit_exam_total, f"Expected totalMarks {edit_exam_total}, got {matching_exam['totalMarks']}"
print(f"[PASS] 8. Verify updated Exam in list: found ID={exam_id}, name='{matching_exam['name']}', totalMarks={matching_exam['totalMarks']}")

# Test 9: Delete unused Exam
del_exam_res = requests.delete(f"{BASE_URL}/api/academic/exams/{exam_id}", headers=headers)
assert del_exam_res.status_code == 200, f"Delete exam failed: {del_exam_res.text}"
get_exams_res_after = requests.get(f"{BASE_URL}/api/academic/exams", headers=headers)
assert not any(e['id'] == exam_id for e in get_exams_res_after.json()['data']), "Deleted exam still present!"
print(f"[PASS] 9. Delete unused Exam: successfully removed ID={exam_id}")

# Test 10: Try deleting Exam that has marks (e.g. Exam ID 8 or 1)
used_exam_ids = [m['examId'] for m in marks if m.get('examId')]
assert len(used_exam_ids) > 0, "No marks found with examId to test dependency protection!"
target_exam_id = used_exam_ids[0]

del_exam_blocked_res = requests.delete(f"{BASE_URL}/api/academic/exams/{target_exam_id}", headers=headers)
assert del_exam_blocked_res.status_code == 409, f"Expected 409 CONFLICT when deleting exam with marks, got {del_exam_blocked_res.status_code}: {del_exam_blocked_res.text}"
exam_err_msg = del_exam_blocked_res.json().get('message', '')
assert "cannot be deleted because marks already exist" in exam_err_msg, f"Unexpected error message: {exam_err_msg}"
print(f"[PASS] 10. Try deleting Exam with marks: correctly BLOCKED with 409. Message: '{exam_err_msg}'")

# Test 11: Verify existing marks are still intact
marks_after_res = requests.get(f"{BASE_URL}/api/academic/marks", headers=headers)
assert marks_after_res.status_code == 200
marks_after = marks_after_res.json()['data']
assert len(marks_after) == len(marks), f"Marks count changed! Original={len(marks)}, After={len(marks_after)}"
print(f"[PASS] 11. Historical marks count verified intact: {len(marks_after)} records preserved")

# Test 12: Verify Marks Entry still works (save mark via POST /marks)
entry_res = requests.post(f"{BASE_URL}/api/academic/marks", headers=headers, json={
    "studentId": 1,
    "admissionNumber": "ADM-001",
    "studentName": "Test Student",
    "className": "Class 10",
    "section": "A",
    "subjectName": "Tamil",
    "examName": "Half Yearly",
    "marksObtained": 85.0,
    "maxMarks": 100.0,
    "remarks": "Good performance"
})
assert entry_res.status_code in [200, 201], f"Marks entry failed: {entry_res.text}"
saved_mark = entry_res.json()['data']
print(f"[PASS] 12. Marks Entry works: Mark recorded with ID={saved_mark['id']}, grade={saved_mark['grade']}")

# Test 13: Verify Marks View still works
view_res = requests.get(f"{BASE_URL}/api/academic/marks?className=Class 10&section=A", headers=headers)
assert view_res.status_code == 200
view_marks = view_res.json()['data']
assert len(view_marks) > 0, "Marks view returned empty list for Class 10 - A"
print(f"[PASS] 13. Marks View works: Found {len(view_marks)} marks records for Class 10 - A")

# Test 14: Verify Bulk Upload Template Download
template_res = requests.get(f"{BASE_URL}/api/academic/marks/bulk-template?mode=WHOLE_SCHOOL", headers=headers)
assert template_res.status_code == 200
assert len(template_res.content) > 1000
print(f"[PASS] 14. Marks Bulk Template download works: {len(template_res.content)} bytes received")

print("\n==============================================")
print("ALL 14 TESTS PASSED FLAWLESSLY!")
print("==============================================")
