import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // Usuário de teste para desenvolvimento
  const testEmail = "dev@dealmind.com"
  const testPassword = "12345678"

  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  })

  if (existingUser) {
    console.log(`✅ Usuário de teste já existe: ${testEmail}`)
  } else {
    const hashedPassword = await hash(testPassword, 12)
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: "Dev User",
      },
    })
    console.log(`✅ Usuário de teste criado: ${user.email}`)
  }

  console.log("")
  console.log("📧 Email: dev@dealmind.com")
  console.log("🔑 Senha: 12345678")
  console.log("")
  console.log("🌱 Seed concluído!")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

