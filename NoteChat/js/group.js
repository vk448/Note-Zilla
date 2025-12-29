function createGroup(name, members) {
  const id = "group_" + Date.now();
  db.ref("groups/" + id).set({
    name,
    admin: currentUser.uid,
    members
  });
}

function removeMember(groupId, uid) {
  db.ref(`groups/${groupId}/members/${uid}`).remove();
}

function deleteGroup(groupId) {
  if (confirm("Delete group?")) {
    db.ref("groups/" + groupId).remove();
  }
}
