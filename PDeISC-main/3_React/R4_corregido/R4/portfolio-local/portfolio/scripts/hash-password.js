import bcrypt from "bcryptjs";
import readline from "node:readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Escribí la contraseña de edición que querés usar: ", async (password) => {
  if (!password) {
    console.error("La contraseña no puede estar vacía.");
    rl.close();
    process.exitCode = 1;
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  console.log("\nCopiá esta línea en las variables de entorno de Vercel:\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  rl.close();
});
