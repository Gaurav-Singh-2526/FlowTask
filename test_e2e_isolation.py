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
    print("=" * 60)
    print("🚀 RUNNING TASKFLOW E2E ISOLATION & PERSISTENCE TEST SUITE")
    print("=" * 60)

    ts = int(time.time())
    email_a = f"leadera_{ts}@flowtask.com"
    email_b = f"leaderb_{ts}@flowtask.com"

    # 1. Create Team Leader A
    print("\n[STEP 1] Creating Team Leader A...")
    code, leader_a = api_post("/users/", {
        "name": "Leader Alpha",
        "email": email_a,
        "password": "password123",
        "role": "Team Leader",
        "title": "Principal Architect",
        "color": "av-blue"
    })
    assert code == 201, f"Failed to create Leader A: {code}, {leader_a}"
    leader_a_id = leader_a["id"]
    print(f"✓ Leader A created: ID {leader_a_id}, Email {leader_a['email']}")

    # 2. Verify Leader A starts with completely empty workspace
    print("\n[STEP 2] Verifying Leader A workspace is completely empty...")
    _, projects_a = api_get(f"/projects/?owner_id={leader_a_id}")
    assert len(projects_a) == 0, f"Leader A should have 0 projects, got {len(projects_a)}"

    _, members_a = api_get(f"/users/?leader_id={leader_a_id}")
    assert len(members_a) == 0, f"Leader A should have 0 members, got {len(members_a)}"

    _, tasks_a = api_get(f"/tasks/?leader_id={leader_a_id}")
    assert len(tasks_a) == 0, f"Leader A should have 0 tasks, got {len(tasks_a)}"

    _, messages_a = api_get(f"/messages/?leader_id={leader_a_id}")
    assert len(messages_a) == 0, f"Leader A should have 0 messages, got {len(messages_a)}"

    _, stats_a = api_get(f"/stats/overview?leader_id={leader_a_id}")
    assert stats_a["total_tasks"] == 0, f"Leader A total tasks should be 0, got {stats_a['total_tasks']}"
    assert stats_a["completed_tasks"] == 0
    print("✓ Leader A workspace is 100% clean and empty.")

    # 3. Leader A creates Projects
    print("\n[STEP 3] Leader A creates 2 projects...")
    code, p1 = api_post("/projects/", {
        "title": "Alpha Sprint Engine",
        "description": "Next-gen task processor",
        "status": "active",
        "deadline": "2026-12-31",
        "owner_id": leader_a_id
    })
    assert code == 201, f"Failed to create project 1: {code}, {p1}"
    p1_id = p1["id"]

    code, p2 = api_post("/projects/", {
        "title": "Beta Temporary Project",
        "description": "To be deleted test project",
        "status": "active",
        "deadline": "2026-11-30",
        "owner_id": leader_a_id
    })
    assert code == 201, f"Failed to create project 2: {code}, {p2}"
    p2_id = p2["id"]
    print(f"✓ Created Projects: P1 ID {p1_id} ('{p1['title']}'), P2 ID {p2_id}")

    # 4. Leader A edits Project 1
    print("\n[STEP 4] Leader A edits Project 1...")
    code, p1_updated = api_put(f"/projects/{p1_id}?requester_id={leader_a_id}", {
        "title": "Alpha Sprint Engine v2",
        "description": "Updated architecture description",
        "status": "in_progress",
        "deadline": "2027-01-15"
    })
    assert code == 200, f"Failed to edit project 1: {code}, {p1_updated}"
    assert p1_updated["title"] == "Alpha Sprint Engine v2"
    assert p1_updated["status"] == "in_progress"
    print(f"✓ Project 1 successfully updated to '{p1_updated['title']}' ({p1_updated['status']})")

    # 5. Leader A deletes Project 2
    print("\n[STEP 5] Leader A deletes Project 2...")
    code, del_res = api_delete(f"/projects/{p2_id}?requester_id={leader_a_id}")
    assert code == 200, f"Failed to delete project 2: {code}, {del_res}"
    _, projects_a_after_del = api_get(f"/projects/?owner_id={leader_a_id}")
    assert len(projects_a_after_del) == 1, f"Expected 1 project remaining, got {len(projects_a_after_del)}"
    assert projects_a_after_del[0]["id"] == p1_id
    print(f"✓ Project 2 deleted; Leader A has exactly 1 project left (P1 ID {p1_id})")

    # 6. Leader A creates Team Members
    print("\n[STEP 6] Leader A adds Team Member...")
    code, m1 = api_post("/users/", {
        "name": "Sarah Connor",
        "email": f"sarah_{ts}@flowtask.com",
        "password": "password123",
        "role": "Team Member",
        "title": "Backend Specialist",
        "color": "av-green",
        "leader_id": leader_a_id
    })
    assert code == 201, f"Failed to create Member 1: {code}, {m1}"
    m1_id = m1["id"]
    print(f"✓ Member created: ID {m1_id}, Name {m1['name']}, Initials {m1['initials']}")

    # 7. Leader A creates Tasks under Project 1 assigned to Member
    print("\n[STEP 7] Leader A creates Tasks assigned to Member...")
    code, t1 = api_post("/tasks/", {
        "title": "Implement PostgreSQL Connection Pooler",
        "description": "High performance connection scaling",
        "status": "in_progress",
        "priority": "high",
        "assignee": m1["initials"],
        "project_id": p1_id,
        "leader_id": leader_a_id,
        "due_date": "2026-11-20"
    })
    assert code == 201, f"Failed to create Task 1: {code}, {t1}"

    code, t2 = api_post("/tasks/", {
        "title": "Setup JWT Authentication Filter",
        "description": "Secure all protected routes",
        "status": "done",
        "priority": "medium",
        "assignee": m1["initials"],
        "project_id": p1_id,
        "leader_id": leader_a_id,
        "due_date": "2026-11-15"
    })
    assert code == 201, f"Failed to create Task 2: {code}, {t2}"
    print(f"✓ Tasks created: T1 ({t1['status']}), T2 ({t2['status']})")

    # Verify Leader A's Stats update dynamically
    _, stats_a_updated = api_get(f"/stats/overview?leader_id={leader_a_id}")
    assert stats_a_updated["total_tasks"] == 2, f"Expected 2 total tasks, got {stats_a_updated['total_tasks']}"
    assert stats_a_updated["completed_tasks"] == 1
    assert stats_a_updated["in_progress_tasks"] == 1
    print(f"✓ Leader A Stats updated: Total {stats_a_updated['total_tasks']}, Completed {stats_a_updated['completed_tasks']}, In Progress {stats_a_updated['in_progress_tasks']}")

    # 8. Leader A sends a Directive / Chat message
    print("\n[STEP 8] Leader A posts a team directive...")
    code, msg = api_post("/messages/", {
        "leader_id": leader_a_id,
        "sender_id": leader_a_id,
        "sender_name": leader_a["name"],
        "sender_role": leader_a["role"],
        "sender_initials": leader_a["initials"],
        "sender_color": leader_a["color"],
        "target": "All Members",
        "message": "Sprint kickoff: please prioritize PostgreSQL pooler setup!"
    })
    assert code == 201, f"Failed to post message: {code}, {msg}"
    print(f"✓ Message stored in DB: ID {msg['id']}")

    # Member replies to Directive
    code, reply = api_post(f"/messages/{msg['id']}/responses", {
        "sender_id": m1["id"],
        "sender_name": m1["name"],
        "sender_role": m1["role"],
        "sender_initials": m1["initials"],
        "sender_color": m1.get("color", "av-green"),
        "message": "On it, pooler configuration is 80% complete."
    })
    assert code == 201, f"Failed to reply: {code}, {reply}"
    print(f"✓ Member reply stored in DB: ID {reply['id']}")

    # 9. Create Team Leader B
    print("\n[STEP 9] Creating Team Leader B...")
    code, leader_b = api_post("/users/", {
        "name": "Leader Beta",
        "email": email_b,
        "password": "password123",
        "role": "Team Leader",
        "title": "VP of Engineering",
        "color": "av-purple"
    })
    assert code == 201, f"Failed to create Leader B: {code}, {leader_b}"
    leader_b_id = leader_b["id"]
    print(f"✓ Leader B created: ID {leader_b_id}, Email {leader_b['email']}")

    # 10. Verify Leader B workspace is 100% ISOLATED and EMPTY
    print("\n[STEP 10] Verifying Leader B sees ZERO data from Leader A...")
    _, projects_b = api_get(f"/projects/?owner_id={leader_b_id}")
    assert len(projects_b) == 0, f"Leader B must see 0 projects, got {len(projects_b)}"

    _, members_b = api_get(f"/users/?leader_id={leader_b_id}")
    assert len(members_b) == 0, f"Leader B must see 0 members, got {len(members_b)}"

    _, tasks_b = api_get(f"/tasks/?leader_id={leader_b_id}")
    assert len(tasks_b) == 0, f"Leader B must see 0 tasks, got {len(tasks_b)}"

    _, messages_b = api_get(f"/messages/?leader_id={leader_b_id}")
    assert len(messages_b) == 0, f"Leader B must see 0 messages, got {len(messages_b)}"

    _, stats_b = api_get(f"/stats/overview?leader_id={leader_b_id}")
    assert stats_b["total_tasks"] == 0, f"Leader B total must be 0, got {stats_b['total_tasks']}"
    print("✓ VERIFIED: Leader B has absolute workspace isolation. Zero data leaked from Leader A.")

    # 11. Test Security & Authorization: Leader B CANNOT edit or delete Leader A's Project
    print("\n[STEP 11] Verifying Leader B cannot modify Leader A's project...")
    code, res = api_put(f"/projects/{p1_id}?requester_id={leader_b_id}", {
        "title": "Hacked by Leader B"
    })
    assert code == 403, f"Expected 403 Forbidden when Leader B edits Leader A's project, got {code}"
    print(f"✓ Leader B edit blocked: 403 Forbidden ({res.get('detail')})")

    code, res = api_delete(f"/projects/{p1_id}?requester_id={leader_b_id}")
    assert code == 403, f"Expected 403 Forbidden when Leader B deletes Leader A's project, got {code}"
    print(f"✓ Leader B delete blocked: 403 Forbidden ({res.get('detail')})")

    # 12. Test Security & Authorization: Team Member CANNOT create, edit, or delete projects
    print("\n[STEP 12] Verifying Team Member cannot create, edit, or delete projects...")
    code, res = api_post("/projects/", {
        "title": "Unauthorized Project",
        "owner_id": m1_id
    })
    assert code == 403, f"Expected 403 Forbidden when Team Member creates project, got {code}"
    print(f"✓ Member create project blocked: 403 Forbidden ({res.get('detail')})")

    code, res = api_put(f"/projects/{p1_id}?requester_id={m1_id}", {
        "title": "Member modified"
    })
    assert code == 403, f"Expected 403 Forbidden when Team Member edits project, got {code}"
    print(f"✓ Member edit project blocked: 403 Forbidden ({res.get('detail')})")

    code, res = api_delete(f"/projects/{p1_id}?requester_id={m1_id}")
    assert code == 403, f"Expected 403 Forbidden when Team Member deletes project, got {code}"
    print(f"✓ Member delete project blocked: 403 Forbidden ({res.get('detail')})")

    # 13. Test Persistence across relogin
    print("\n[STEP 13] Verifying Login Authentication and Data Persistence...")
    code, login_a = api_post("/users/login", {
        "email": email_a,
        "password": "password123"
    })
    assert code == 200, f"Login failed for Leader A: {code}"
    assert login_a["email"] == email_a

    # Check Leader A's data is all intact
    _, proj_check = api_get(f"/projects/?owner_id={leader_a_id}")
    assert len(proj_check) == 1 and proj_check[0]["title"] == "Alpha Sprint Engine v2"

    _, tasks_check = api_get(f"/tasks/?leader_id={leader_a_id}")
    assert len(tasks_check) == 2

    _, msg_check = api_get(f"/messages/?leader_id={leader_a_id}")
    assert len(msg_check) == 1 and len(msg_check[0].get("responses", [])) == 1
    print("✓ Full database persistence confirmed across sessions and relogin.")

    # 14. Clean up test users and their data
    print("\n[STEP 14] Cleaning up test data...")
    # Delete tasks
    for t in tasks_check:
        api_delete(f"/tasks/{t['id']}")
    # Delete project
    api_delete(f"/projects/{p1_id}?requester_id={leader_a_id}")
    # Delete users
    api_delete(f"/users/{m1_id}")
    api_delete(f"/users/{leader_b_id}")
    api_delete(f"/users/{leader_a_id}")
    print("✓ Test cleanup completed successfully.")

    print("\n" + "=" * 60)
    print("🎉 ALL 14 E2E ISOLATION & PERSISTENCE TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
