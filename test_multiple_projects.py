"""
test_multiple_projects.py
Verifies:
1. Multiple project selection when creating / editing a Team Member.
2. team_member_projects many-to-many relationship with foreign keys and unique constraints in Supabase.
3. Team Member assigned to 3 different projects sees all 3 projects on their dashboard.
4. Tasks remain correctly separated by project.
5. Task creation validation: assigning a task in an unassigned project is blocked.
6. Team Leader can edit member projects (add/remove) and changes persist.
7. Team Leader can edit their own profile and changes persist.
8. Security & permissions (member cannot assign projects to self or edit other profiles).
"""

import sys
import time
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

API_BASE = "http://127.0.0.1:8001"

def api_post(endpoint, json_data):
    res = requests.post(f"{API_BASE}{endpoint}", json=json_data)
    return res.status_code, res.json() if res.content else {}

def api_get(endpoint):
    res = requests.get(f"{API_BASE}{endpoint}")
    return res.status_code, res.json() if res.content else {}

def api_put(endpoint, json_data):
    res = requests.put(f"{API_BASE}{endpoint}", json=json_data)
    return res.status_code, res.json() if res.content else {}

def api_delete(endpoint):
    res = requests.delete(f"{API_BASE}{endpoint}")
    return res.status_code, res.json() if res.content else {}

def run_tests():
    print("=" * 68)
    print("🚀 TESTING MULTIPLE PROJECT ASSIGNMENTS & LEADER PROFILE")
    print("=" * 68)
    ts = int(time.time())

    # 1. Create Team Leader
    print("\n[TEST 1] Creating Team Leader...")
    code, leader = api_post("/users/", {
        "name": f"Enterprise Lead {ts}",
        "email": f"lead_{ts}@flowtask.com",
        "password": "password123",
        "role": "Team Leader",
        "title": "Engineering Director",
        "color": "av-blue"
    })
    assert code == 201, f"Failed to create Leader: {code}, {leader}"
    leader_id = leader["id"]
    print(f"✓ Leader created: ID {leader_id}")

    # 2. Create 4 Projects (A, B, C, and D)
    print("\n[TEST 2] Team Leader creates 4 projects (Alpha, Beta, Gamma, Delta)...")
    projects = {}
    for name in ["Alpha", "Beta", "Gamma", "Delta"]:
        code, p = api_post("/projects/", {
            "title": f"Project {name} {ts}",
            "description": f"Core initiative {name}",
            "status": "active",
            "owner_id": leader_id
        })
        assert code == 201, f"Failed to create Project {name}: {code}, {p}"
        projects[name] = p
        print(f"  ✓ Created Project {name}: ID {p['id']}")

    p_alpha = projects["Alpha"]["id"]
    p_beta = projects["Beta"]["id"]
    p_gamma = projects["Gamma"]["id"]
    p_delta = projects["Delta"]["id"]

    # 3. Create Team Member (TM1) and assign to Alpha, Beta, Gamma (3 projects!)
    # Include duplicate in payload to test duplicate prevention
    print("\n[TEST 3] Creating TM1 and assigning to 3 projects (Alpha, Beta, Gamma) with duplicate check...")
    code, tm1 = api_post("/users/", {
        "name": "Sarah Connor Specialist",
        "email": f"sarah_{ts}@flowtask.com",
        "password": "password123",
        "role": "Team Member",
        "title": "Systems Engineer",
        "color": "av-green",
        "leader_id": leader_id,
        "project_ids": [p_alpha, p_beta, p_gamma, p_alpha] # Duplicate p_alpha test
    })
    assert code == 201, f"Failed to create TM1: {code}, {tm1}"
    tm1_id = tm1["id"]

    assigned_pids = tm1.get("assigned_project_ids", [])
    print(f"✓ TM1 created (ID {tm1_id}). Assigned Project IDs: {assigned_pids}")
    assert set(assigned_pids) == {p_alpha, p_beta, p_gamma}, f"Expected {p_alpha, p_beta, p_gamma}, got {assigned_pids}"
    assert len(assigned_pids) == 3, f"Duplicate assignment should be eliminated! Got: {assigned_pids}"

    # Also create TM2 assigned only to Delta
    code, tm2 = api_post("/users/", {
        "name": "Kyle Reese Guard",
        "email": f"kyle_{ts}@flowtask.com",
        "password": "password123",
        "role": "Team Member",
        "title": "Security Analyst",
        "leader_id": leader_id,
        "project_ids": [p_delta]
    })
    assert code == 201
    tm2_id = tm2["id"]
    print(f"✓ TM2 created (ID {tm2_id}) assigned only to Project Delta ({p_delta})")

    # 4. Team Member queries projects: TM1 should see ONLY Alpha, Beta, Gamma (NOT Delta)
    print("\n[TEST 4] Verifying TM1 sees only their 3 assigned projects...")
    code, tm1_projects = api_get(f"/projects/?requester_id={tm1_id}")
    assert code == 200
    tm1_pids = [p["id"] for p in tm1_projects]
    print(f"  TM1 visible project IDs: {tm1_pids}")
    assert set(tm1_pids) == {p_alpha, p_beta, p_gamma}, f"TM1 should see Alpha, Beta, Gamma, got {tm1_pids}"
    assert p_delta not in tm1_pids, "Project Delta must NOT be visible to TM1!"
    print("✓ TM1 project isolation verified: Exactly 3 assigned projects visible.")

    # 5. Leader creates tasks for TM1 in Alpha, Beta, and Gamma
    print("\n[TEST 5] Leader creates tasks in Alpha, Beta, and Gamma assigned to TM1...")
    code, t_alpha = api_post(f"/tasks/?requester_id={leader_id}", {
        "title": "Alpha Pipeline Engine",
        "project_id": p_alpha,
        "assignee_id": tm1_id,
        "priority": "high",
        "status": "in_progress"
    })
    assert code == 201, f"Failed task Alpha: {code}, {t_alpha}"
    t_alpha_id = t_alpha["id"]

    code, t_beta = api_post(f"/tasks/?requester_id={leader_id}", {
        "title": "Beta Schema Migrations",
        "project_id": p_beta,
        "assignee_id": tm1_id,
        "priority": "medium",
        "status": "todo"
    })
    assert code == 201, f"Failed task Beta: {code}, {t_beta}"
    t_beta_id = t_beta["id"]

    code, t_gamma = api_post(f"/tasks/?requester_id={leader_id}", {
        "title": "Gamma Verification Suite",
        "project_id": p_gamma,
        "assignee_id": tm1_id,
        "priority": "high",
        "status": "done"
    })
    assert code == 201, f"Failed task Gamma: {code}, {t_gamma}"
    t_gamma_id = t_gamma["id"]
    print(f"✓ Tasks created in 3 different projects for TM1 (IDs: {t_alpha_id}, {t_beta_id}, {t_gamma_id})")

    # 6. Validate project-member relationship: Leader tries to assign task in Project Delta to TM1
    print("\n[TEST 6] Validating task assignment enforcement (TM1 is NOT assigned to Project Delta)...")
    code, blocked_res = api_post(f"/tasks/?requester_id={leader_id}", {
        "title": "Unauthorized Delta Deliverable",
        "project_id": p_delta,
        "assignee_id": tm1_id,
        "priority": "low"
    })
    assert code == 400, f"Expected 400 Bad Request when assigning task to unassigned member, got {code}"
    print(f"✓ Assignment blocked correctly: 400 Bad Request ({blocked_res.get('detail')})")

    # 7. Project-wise task separation for TM1
    print("\n[TEST 7] Verifying tasks are separated by project on TM1 dashboard...")
    code, all_tm1_tasks = api_get(f"/tasks/?requester_id={tm1_id}")
    assert code == 200
    assert len(all_tm1_tasks) == 3, f"Expected 3 total tasks for TM1, got {len(all_tm1_tasks)}"

    code, alpha_tasks = api_get(f"/tasks/?requester_id={tm1_id}&project_id={p_alpha}")
    assert code == 200
    assert len(alpha_tasks) == 1 and alpha_tasks[0]["id"] == t_alpha_id
    print("  ✓ Alpha project tasks: 1 task ('Alpha Pipeline Engine')")

    code, beta_tasks = api_get(f"/tasks/?requester_id={tm1_id}&project_id={p_beta}")
    assert code == 200
    assert len(beta_tasks) == 1 and beta_tasks[0]["id"] == t_beta_id
    print("  ✓ Beta project tasks: 1 task ('Beta Schema Migrations')")

    code, gamma_tasks = api_get(f"/tasks/?requester_id={tm1_id}&project_id={p_gamma}")
    assert code == 200
    assert len(gamma_tasks) == 1 and gamma_tasks[0]["id"] == t_gamma_id
    print("  ✓ Gamma project tasks: 1 task ('Gamma Verification Suite')")

    # 8. Edit Team Member Projects (Leader removes Beta, adds Delta)
    print("\n[TEST 8] Leader edits TM1's project assignments (removes Beta, adds Delta)...")
    code, updated_tm1 = api_put(f"/users/{tm1_id}?requester_id={leader_id}", {
        "name": "Sarah Connor Specialist v2",
        "project_ids": [p_alpha, p_gamma, p_delta]
    })
    assert code == 200, f"Failed to edit TM1: {code}, {updated_tm1}"
    new_pids = updated_tm1.get("assigned_project_ids", [])
    print(f"  ✓ Updated TM1 project assignments: {new_pids}")
    assert set(new_pids) == {p_alpha, p_gamma, p_delta}
    assert p_beta not in new_pids

    # 9. Verify dedicated project assignment endpoint PUT /users/{id}/projects
    print("\n[TEST 9] Testing dedicated assignment endpoint PUT /users/{id}/projects...")
    code, reassigned_tm1 = api_put(f"/users/{tm1_id}/projects?requester_id={leader_id}", {
        "project_ids": [p_alpha, p_beta, p_gamma]
    })
    assert code == 200
    assert set(reassigned_tm1["assigned_project_ids"]) == {p_alpha, p_beta, p_gamma}
    print("  ✓ PUT /users/{id}/projects successfully updated assignments in Supabase")

    # 10. Team Leader edits own profile
    print("\n[TEST 10] Team Leader edits own profile (name, phone, bio, avatar, title)...")
    code, updated_leader = api_put(f"/users/{leader_id}/profile?requester_id={leader_id}", {
        "name": "Alex Vance VP Engineering",
        "phone": "+1 (555) 987-6543",
        "bio": "Leading distributed cloud infrastructure teams",
        "color": "av-purple",
        "title": "VP of Engineering & Architecture"
    })
    assert code == 200, f"Leader failed to update profile: {code}, {updated_leader}"
    assert updated_leader["name"] == "Alex Vance VP Engineering"
    assert updated_leader["phone"] == "+1 (555) 987-6543"
    assert updated_leader["color"] == "av-purple"
    assert updated_leader["title"] == "VP of Engineering & Architecture"
    print(f"✓ Leader profile successfully updated: '{updated_leader['name']}' ({updated_leader['phone']})")

    # Verify leader profile persistence across re-login
    code, relogin_leader = api_post("/users/login", {
        "email": leader["email"],
        "password": "password123"
    })
    assert code == 200
    assert relogin_leader["name"] == "Alex Vance VP Engineering"
    assert relogin_leader["phone"] == "+1 (555) 987-6543"
    assert relogin_leader["bio"] == "Leading distributed cloud infrastructure teams"
    print("✓ Full leader profile persistence confirmed in Supabase PostgreSQL upon re-login.")

    # 11. Security checks
    print("\n[TEST 11] Security & Permission verification...")
    # Member cannot edit leader's profile
    code, sec_res = api_put(f"/users/{leader_id}/profile?requester_id={tm1_id}", {
        "name": "Hacked Name"
    })
    assert code == 403, f"Expected 403 when Member edits other profile, got {code}"
    print("  ✓ Member editing other user's profile blocked: 403 Forbidden")

    # Member cannot assign projects to themselves
    code, sec_res = api_put(f"/users/{tm1_id}?requester_id={tm1_id}", {
        "project_ids": [p_delta]
    })
    assert code == 403, f"Expected 403 when Member self-assigns projects, got {code}"
    print("  ✓ Member self-assigning projects blocked: 403 Forbidden")

    # 12. Cleanup
    print("\n[TEST 12] Cleaning up test records...")
    api_delete(f"/tasks/{t_alpha_id}?requester_id={leader_id}")
    api_delete(f"/tasks/{t_beta_id}?requester_id={leader_id}")
    api_delete(f"/tasks/{t_gamma_id}?requester_id={leader_id}")
    api_delete(f"/projects/{p_alpha}?requester_id={leader_id}")
    api_delete(f"/projects/{p_beta}?requester_id={leader_id}")
    api_delete(f"/projects/{p_gamma}?requester_id={leader_id}")
    api_delete(f"/projects/{p_delta}?requester_id={leader_id}")
    api_delete(f"/users/{tm1_id}")
    api_delete(f"/users/{tm2_id}")
    api_delete(f"/users/{leader_id}")
    print("✓ Test cleanup completed successfully.")

    print("\n" + "=" * 68)
    print("🎉 ALL 11 MULTIPLE PROJECT & PROFILE TESTS PASSED PERFECTLY!")
    print("=" * 68)

if __name__ == "__main__":
    run_tests()
