import requests
import json

token = requests.post('http://localhost:8080/api/auth/login', json={'email':'admin@school.com','password':'Admin@123'}).json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

classes = requests.get('http://localhost:8080/api/students/classes', headers=headers).json()
print('Classes:', classes)

all_stu = requests.get('http://localhost:8080/api/students?pageSize=100', headers=headers).json()
print('\nAll students structure keys in data:', list(all_stu['data'].keys()))
print('Number of students in data.data:', len(all_stu['data']['data']))
for s in all_stu['data']['data']:
    print(f"  ID={s['id']}, Adm={s['admissionNumber']}, Name={s['name']}, Class='{s['className']}', Section='{s['section']}', isActive={s['isActive']}")

res_10 = requests.get('http://localhost:8080/api/students/class/10/active', headers=headers)
print('\nActive in class 10: count=', len(res_10.json().get('data', [])))

res_class10 = requests.get('http://localhost:8080/api/students/class/Class 10/active', headers=headers)
print('Active in Class 10: count=', len(res_class10.json().get('data', [])))
