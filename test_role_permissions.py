import urllib.request
import urllib.parse
import json
import time
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8001"

def api_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        try:
            return e.code, json.loads(err_msg)
        except Exception:
            return e.code, err_msg

def api_post(path, data):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        try:
            return e.code, json.loads(err_msg)
        except Exception:
            return e.code, err_msg

def api_put(path, data):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        try:
            return e.code, json.loads(err_msg)
        except Exception:
            return e.code, err_msg

def api_delete(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        try:
            return e.code, json.loads(err_msg)
        except Exception:
            return e.code, err_msg

def run_tests():
    print("=" * 65)
    print("🎯 TESTING ROLE-BASED TASK MANAGEMENT & TEAM MEMBER DASHBOARD")
    print("=" * 65)

    ts = int(time.time())
    leader_email = f"leader_{ts}@flowtask.com"
    member1_email = f"member1_{ts}@flowtask.com"
    member2_email = f"member2_{ts}@flowtask.com"

    # 1. Create a Team Leader account
    print("\n[TEST 1] Creating Team Leader account...")
    code, tl1 = api_post("/users/", {
        "name": "Sarah Connor Lead",
        "email": leader_email,
        "password": "password123",
        "role": "Team Leader",
        "title": "Lead Architect",
        "color": "av-blue"
    })
    assert code == 201, f"Failed to create Team Leader: {code}, {tl1}"
    tl1_id = tl1["id"]
    print(f"✓ Team Leader created: ID {tl1_id}, Email {tl1['email']}")

    # 2. Create Team Member accounts (TM1 and TM2) under TL1
    print("\n[TEST 2] Creating Team Member accounts...")
    code, tm1 = api_post("/users/", {
        "name": "Kyle Reese",
        "email": member1_email,
        "password": "password123",
        "role": "Team Member",
        "title": "Backend Dev",
        "color": "av-green",
        "leader_id": tl1_id
    })
    assert code == 201, f"Failed to create TM1: {code}, {tm1}"
    tm1_id = tm1["id"]

    code, tm2 = api_post("/users/", {
        "name": "John Connor",
        "email": member2_email,
        "password": "password123",
        "role": "Team Member",
        "title": "Frontend Dev",
        "color": "av-orange",
        "leader_id": tl1_id
    })
    assert code == 201, f"Failed to create TM2: {code}, {tm2}"
    tm2_id = tm2["id"]
    print(f"✓ Team Members created: TM1 (ID {tm1_id}, {tm1['name']}), TM2 (ID {tm2_id}, {tm2['name']})")

    # Create Project
    code, proj = api_post("/projects/", {
        "title": "Project Skynet Firewall",
        "description": "Enterprise security project",
        "status": "active",
        "deadline": "2026-12-31",
        "owner_id": tl1_id
    })
    assert code == 201
    proj_id = proj["id"]

    # Assign TM1 and TM2 to the project
    api_put(f"/users/{tm1_id}/projects?requester_id={tl1_id}", {"project_ids": [proj_id]})
    api_put(f"/users/{tm2_id}/projects?requester_id={tl1_id}", {"project_ids": [proj_id]})

    # 3. Team Leader creates task and assigns it to Team Member
    print("\n[TEST 3] Team Leader creates tasks and assigns them...")
    code, t1 = api_post(f"/tasks/?requester_id={tl1_id}", {
        "title": "Build Secure JWT Validator",
        "description": "Implement token validation middleware",
        "priority": "high",
        "status": "todo",
        "assignee": tm1["initials"],
        "assignee_id": tm1_id,
        "project_id": proj_id,
        "leader_id": tl1_id,
        "due_date": "2026-11-20"
    })
    assert code == 201, f"Failed to create Task 1: {code}, {t1}"
    t1_id = t1["id"]

    code, t2 = api_post(f"/tasks/?requester_id={tl1_id}", {
        "title": "Design Responsive UI Components",
        "description": "Build reusable React components",
        "priority": "medium",
        "status": "in_progress",
        "assignee": tm2["initials"],
        "assignee_id": tm2_id,
        "project_id": proj_id,
        "leader_id": tl1_id,
        "due_date": "2026-11-25"
    })
    assert code == 201, f"Failed to create Task 2: {code}, {t2}"
    t2_id = t2["id"]
    print(f"✓ Tasks created: T1 (ID {t1_id}, assigned to {tm1['name']}), T2 (ID {t2_id}, assigned to {tm2['name']})")

    # 4. Team Member logs in and sees ONLY assigned tasks
    print("\n[TEST 4] Team Member fetches tasks & verifies isolation...")
    code, tm1_tasks = api_get(f"/tasks/?requester_id={tm1_id}")
    print(f"DEBUG tm1_tasks count: {len(tm1_tasks)}")
    for t in tm1_tasks:
        print(f"  Task {t['id']}: '{t['title']}', assignee: {t['assignee']}, assignee_id: {t['assignee_id']}, leader_id: {t['leader_id']}")
    assert code == 200
    assert len(tm1_tasks) == 1, f"TM1 should see exactly 1 assigned task, got {len(tm1_tasks)}"
    assert tm1_tasks[0]["id"] == t1_id, f"TM1 should only see T1, got {tm1_tasks[0]['id']}"
    assert tm1_tasks[0]["project_title"] == "Project Skynet Firewall"

    code, tm1_stats = api_get(f"/stats/overview?member_id={tm1_id}")
    assert tm1_stats["total_tasks"] == 1
    assert tm1_stats["completed_tasks"] == 0
    assert tm1_stats["in_progress_tasks"] == 0
    assert tm1_stats["pending_tasks"] == 1
    print(f"✓ TM1 sees only assigned tasks (T1: '{tm1_tasks[0]['title']}'). Zero leakage of TM2 tasks.")

    # 5. Team Member CANNOT create or delete tasks
    print("\n[TEST 5] Verifying Team Member cannot create or delete tasks...")
    code, res = api_post(f"/tasks/?requester_id={tm1_id}", {
        "title": "Unauthorized Task by Member",
        "project_id": proj_id,
        "priority": "low"
    })
    assert code == 403, f"Expected 403 when Member creates task, got {code}"
    print(f"✓ Member create task blocked: 403 Forbidden ({res.get('detail')})")

    code, res = api_delete(f"/tasks/{t1_id}?requester_id={tm1_id}")
    assert code == 403, f"Expected 403 when Member deletes task, got {code}"
    print(f"✓ Member delete task blocked: 403 Forbidden ({res.get('detail')})")

    # 6. Team Member updates task status (Allowed: Pending, In Progress, Completed)
    print("\n[TEST 6] Team Member updates task status...")
    code, updated_t1 = api_put(f"/tasks/{t1_id}?requester_id={tm1_id}", {
        "status": "in_progress"
    })
    assert code == 200, f"Failed to update task status: {code}, {updated_t1}"
    assert updated_t1["status"] == "in_progress"
    print(f"✓ Task 1 status successfully updated to '{updated_t1['status']}'")

    # Member CANNOT modify task title, description, priority, etc.
    code, res = api_put(f"/tasks/{t1_id}?requester_id={tm1_id}", {
        "title": "Hacked Title by Member"
    })
    assert code == 403, f"Expected 403 when Member edits title, got {code}"
    print(f"✓ Member title modification blocked: 403 Forbidden ({res.get('detail')})")

    # Member CANNOT update someone else's task
    code, res = api_put(f"/tasks/{t2_id}?requester_id={tm1_id}", {
        "status": "done"
    })
    assert code == 403, f"Expected 403 when Member updates another user's task, got {code}"
    print(f"✓ Member updating other's task blocked: 403 Forbidden ({res.get('detail')})")

    # 7. Both dashboards reflect updated task status
    print("\n[TEST 7] Verifying dynamic statistics on both dashboards...")
    code, tm1_stats_updated = api_get(f"/stats/overview?member_id={tm1_id}")
    assert tm1_stats_updated["in_progress_tasks"] == 1
    assert tm1_stats_updated["total_tasks"] == 1

    code, tl1_stats = api_get(f"/stats/overview?leader_id={tl1_id}")
    assert tl1_stats["total_tasks"] == 2
    assert tl1_stats["in_progress_tasks"] == 2  # T1 and T2 are both in_progress now
    print(f"✓ Member Dashboard stats: Total {tm1_stats_updated['total_tasks']}, In Progress {tm1_stats_updated['in_progress_tasks']}")
    print(f"✓ Leader Dashboard stats: Total {tl1_stats['total_tasks']}, In Progress {tl1_stats['in_progress_tasks']}")

    # 8. Team Member edits their own profile
    print("\n[TEST 8] Team Member edits own profile (name, phone, bio, color)...")
    code, updated_profile = api_put(f"/users/{tm1_id}/profile?requester_id={tm1_id}", {
        "name": "Kyle Reese Specialist",
        "phone": "+1 (555) 019-2834",
        "bio": "Lead Cloud Infrastructure Engineer & Systems Auditor",
        "color": "av-purple",
        "title": "Staff Infrastructure Engineer"
    })
    assert code == 200, f"Failed to update profile: {code}, {updated_profile}"
    assert updated_profile["name"] == "Kyle Reese Specialist"
    assert updated_profile["phone"] == "+1 (555) 019-2834"
    assert updated_profile["bio"] == "Lead Cloud Infrastructure Engineer & Systems Auditor"
    assert updated_profile["color"] == "av-purple"
    assert updated_profile["title"] == "Staff Infrastructure Engineer"
    print(f"✓ Profile updated successfully: '{updated_profile['name']}' ({updated_profile['phone']})")

    # 9. Profile changes persist after logout and login
    print("\n[TEST 9] Verifying profile persistence across relogin...")
    code, login_res = api_post("/users/login", {
        "email": member1_email,
        "password": "password123"
    })
    assert code == 200
    assert login_res["name"] == "Kyle Reese Specialist"
    assert login_res["phone"] == "+1 (555) 019-2834"
    assert login_res["bio"] == "Lead Cloud Infrastructure Engineer & Systems Auditor"
    assert login_res["color"] == "av-purple"
    print("✓ Full profile persistence confirmed from Supabase PostgreSQL upon relogin.")

    # 10. Team Member CANNOT access or edit another user's profile
    print("\n[TEST 10] Verifying Team Member cannot edit other profiles or change role...")
    code, res = api_put(f"/users/{tm2_id}/profile?requester_id={tm1_id}", {
        "name": "Hacked User"
    })
    assert code == 403, f"Expected 403 when Member edits other profile, got {code}"
    print(f"✓ Member editing other profile blocked: 403 Forbidden ({res.get('detail')})")

    code, res = api_put(f"/users/{tm1_id}?requester_id={tm1_id}", {
        "role": "Team Leader"
    })
    assert code == 403, f"Expected 403 when Member escalates role, got {code}"
    print(f"✓ Member role escalation blocked: 403 Forbidden ({res.get('detail')})")

    # 11. Team Leader retains all task management permissions
    print("\n[TEST 11] Verifying Team Leader retains all management permissions...")
    # Leader edits task details
    code, edited_task = api_put(f"/tasks/{t1_id}?requester_id={tl1_id}", {
        "title": "Build Secure JWT Validator v2",
        "description": "Added cryptographic signing verification",
        "priority": "high",
        "due_date": "2026-11-22"
    })
    assert code == 200, f"Leader failed to edit task: {code}, {edited_task}"
    assert edited_task["title"] == "Build Secure JWT Validator v2"
    print(f"✓ Leader edited task details: '{edited_task['title']}' ({edited_task['priority']})")

    # Leader deletes a task
    code, del_task = api_delete(f"/tasks/{t2_id}?requester_id={tl1_id}")
    assert code == 200
    print(f"✓ Leader deleted Task 2: {del_task.get('detail')}")

    # 12. Cleanup
    print("\n[TEST 12] Cleaning up test records...")
    api_delete(f"/tasks/{t1_id}?requester_id={tl1_id}")
    api_delete(f"/projects/{proj_id}?requester_id={tl1_id}")
    api_delete(f"/users/{tm1_id}")
    api_delete(f"/users/{tm2_id}")
    api_delete(f"/users/{tl1_id}")
    print("✓ Test cleanup completed successfully.")

    print("\n" + "=" * 65)
    print("🎉 ALL 11 ROLE MANAGEMENT & MEMBER DASHBOARD TESTS PASSED!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
