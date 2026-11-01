// Grants the admin role (users/{uid}.isAdmin), which used to be the IsAdmin column.
//   npm run set-admin -- someone@example.com
//   npm run set-admin -- someone@example.com --create --password "..." --name "Admin"
//     (--create makes the account first; handy for a fresh project or the emulator)
import { FieldValue } from "firebase-admin/firestore";
import { args, auth, db, hasFlag, option, target } from "./lib.ts";

async function main() {
  const email = args.find((a) => a.includes("@"));
  if (!email) {
    console.error("Usage: npm run set-admin -- <email> [--create --password <password> --name <full name>]");
    process.exit(1);
  }

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    if (!hasFlag("--create")) {
      console.error(`No Firebase Auth user with email ${email} in ${target}.`);
      process.exit(1);
    }
    const password = option("--password");
    if (!password || password.length < 6) {
      console.error("--password (at least 6 characters) is required with --create.");
      process.exit(1);
    }
    user = await auth.createUser({ email, password, displayName: option("--name") ?? email });
    console.log(`Created user ${email}.`);
  }

  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ isAdmin: true });
  } else {
    await ref.set({
      fullName: user.displayName ?? option("--name") ?? email,
      email,
      phone: null,
      isAdmin: true,
      googleId: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`${email} is now an admin in ${target}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
