function canChat(sender, receiver) {
  if (!sender || !receiver) return false;

  // Coach can chat with anyone
  if (sender.role === "coach") return true;

  // User can chat only with coach
  if (sender.role === "user" && receiver.role === "coach") return true;

  return false;
}

module.exports = { canChat };
