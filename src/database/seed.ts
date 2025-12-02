// Database seeding script for development/testing
import { getDatabase as getDbConnection, closeDatabase } from "./connection"
import { getDatabase } from "./repositories"
import { MigrationRunner } from "./migrations"
import * as crypto from "crypto"
import path from "path"

// Helper function to generate demo password hash
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// Helper to get date N days ago
function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

// Helper to get date N days from now
function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

async function seed() {
  console.log("🌱 Starting database seed...\n")

  const connection = getDbConnection()
  const db = getDatabase()

  try {
    // Run migrations first
    console.log("📦 Running migrations...")
    const runner = new MigrationRunner(connection, path.join(process.cwd(), "migrations"))
    runner.runAll()
    console.log("✅ Migrations complete\n")

    // Check if already seeded
    const existingUser = db.users.findByEmail("demo@jobtracker.com")
    if (existingUser) {
      console.log("⚠️  Database already contains seed data. Skipping seed.")
      console.log('    Run "npm run db:reset" to clear and reseed.\n')
      return
    }

    console.log("👤 Creating demo user...")
    const user = db.users.create({
      email: "demo@jobtracker.com",
      password_hash: hashPassword("demo123"),
      full_name: "Demo User"
    })
    console.log(`   ✓ Created user: ${user.email}\n`)

    // Create companies
    console.log("🏢 Creating companies...")
    const companies = [
      db.companies.create({
        user_id: user.id,
        name: "TechCorp Inc.",
        website: "https://techcorp.example.com",
        industry: "Technology",
        size: "1000-5000",
        location: "San Francisco, CA",
        description: "Leading enterprise software solutions provider"
      }),
      db.companies.create({
        user_id: user.id,
        name: "StartupHub",
        website: "https://startuphub.io",
        industry: "SaaS",
        size: "50-200",
        location: "Remote",
        description: "Fast-growing startup in the productivity space"
      }),
      db.companies.create({
        user_id: user.id,
        name: "Digital Dynamics",
        website: "https://digitaldynamics.com",
        industry: "Consulting",
        size: "200-500",
        location: "New York, NY",
        description: "Digital transformation and cloud consulting"
      }),
      db.companies.create({
        user_id: user.id,
        name: "AI Innovations",
        website: "https://aiinnovations.ai",
        industry: "Artificial Intelligence",
        size: "10-50",
        location: "Boston, MA",
        description: "Cutting-edge AI/ML research and applications"
      }),
      db.companies.create({
        user_id: user.id,
        name: "Global Systems Ltd",
        website: "https://globalsystems.com",
        industry: "Finance",
        size: "5000+",
        location: "London, UK",
        description: "International financial services and fintech"
      })
    ]
    companies.forEach((c) => console.log(`   ✓ ${c.name}`))
    console.log()

    // Create tags
    console.log("🏷️  Creating tags...")
    const tags = [
      db.tags.create({ name: "Frontend", color: "#3B82F6" }),
      db.tags.create({ name: "Backend", color: "#10B981" }),
      db.tags.create({ name: "Full-Stack", color: "#8B5CF6" }),
      db.tags.create({ name: "Remote", color: "#F59E0B" }),
      db.tags.create({ name: "High-Priority", color: "#EF4444" }),
      db.tags.create({ name: "FAANG", color: "#EC4899" }),
      db.tags.create({ name: "Startup", color: "#14B8A6" })
    ]
    tags.forEach((t) => console.log(`   ✓ ${t.name} (${t.color})`))
    console.log()

    // Create job applications with varied statuses
    console.log("📝 Creating job applications...")
    const applications = [
      // Applied status
      db.jobApplications.create({
        user_id: user.id,
        company_id: companies[0].id,
        position_title: "Senior Frontend Engineer",
        status: "applied",
        application_date: daysAgo(2),
        job_posting_url: "https://techcorp.example.com/careers/senior-frontend",
        salary_min: 140000,
        salary_max: 180000,
        location: "San Francisco, CA",
        work_type: "hybrid",
        notes: "Strong React/TypeScript requirements. Team seems great from research."
      }),

      // Screening status
      db.jobApplications.create({
        user_id: user.id,
        company_id: companies[1].id,
        position_title: "Full-Stack Developer",
        status: "screening",
        application_date: daysAgo(7),
        job_posting_url: "https://startuphub.io/jobs/fullstack",
        salary_min: 120000,
        salary_max: 150000,
        location: "Remote",
        work_type: "remote",
        notes: "Passed initial phone screen. HR scheduling technical interview."
      }),

      // Interview status
      db.jobApplications.create({
        user_id: user.id,
        company_id: companies[2].id,
        position_title: "Cloud Solutions Architect",
        status: "interview",
        application_date: daysAgo(14),
        job_posting_url: "https://digitaldynamics.com/careers/cloud-architect",
        salary_min: 160000,
        salary_max: 200000,
        location: "New York, NY",
        work_type: "hybrid",
        notes: "Technical interview went well. Final round scheduled next week."
      }),

      // Offer status
      db.jobApplications.create({
        user_id: user.id,
        company_id: companies[3].id,
        position_title: "Machine Learning Engineer",
        status: "offer",
        application_date: daysAgo(30),
        job_posting_url: "https://aiinnovations.ai/careers/ml-engineer",
        salary_min: 150000,
        salary_max: 150000,
        location: "Boston, MA",
        work_type: "onsite",
        notes: "Received offer! $150k base + equity. Negotiating start date."
      }),

      // Rejected status
      db.jobApplications.create({
        user_id: user.id,
        company_id: companies[4].id,
        position_title: "Backend Engineer",
        status: "rejected",
        application_date: daysAgo(21),
        salary_min: 130000,
        salary_max: 170000,
        location: "London, UK",
        work_type: "remote",
        notes: "Rejected after final round. Feedback: needed more distributed systems experience."
      }),

      // Withdrawn status
      db.jobApplications.create({
        user_id: user.id,
        company_id: companies[0].id,
        position_title: "Engineering Manager",
        status: "withdrawn",
        application_date: daysAgo(10),
        salary_min: 180000,
        salary_max: 220000,
        location: "San Francisco, CA",
        work_type: "onsite",
        notes: "Withdrew application - not ready for management role yet."
      })
    ]

    applications.forEach((app) =>
      console.log(`   ✓ ${app.position_title} at ${companies.find((c) => c.id === app.company_id)?.name} (${app.status})`)
    )
    console.log()

    // Add tags to applications
    console.log("🔗 Linking tags to applications...")
    db.jobApplications.addTag(applications[0].id, tags[0].id) // Frontend
    db.jobApplications.addTag(applications[0].id, tags[5].id) // FAANG

    db.jobApplications.addTag(applications[1].id, tags[2].id) // Full-Stack
    db.jobApplications.addTag(applications[1].id, tags[3].id) // Remote
    db.jobApplications.addTag(applications[1].id, tags[6].id) // Startup

    db.jobApplications.addTag(applications[2].id, tags[1].id) // Backend
    db.jobApplications.addTag(applications[2].id, tags[4].id) // High-Priority

    db.jobApplications.addTag(applications[3].id, tags[1].id) // Backend
    db.jobApplications.addTag(applications[3].id, tags[4].id) // High-Priority
    db.jobApplications.addTag(applications[3].id, tags[6].id) // Startup

    db.jobApplications.addTag(applications[4].id, tags[1].id) // Backend
    db.jobApplications.addTag(applications[4].id, tags[3].id) // Remote
    console.log("   ✓ Tags linked to applications\n")

    // Create contacts
    console.log("👥 Creating contacts...")
    const contacts = [
      db.contacts.create({
        job_application_id: applications[0].id,
        name: "Sarah Chen",
        title: "Senior Recruiter",
        email: "sarah.chen@techcorp.com",
        phone: "+1-415-555-0123",
        linkedin_url: "https://linkedin.com/in/sarahchen",
        notes: "Very responsive. Prefers email communication."
      }),
      db.contacts.create({
        job_application_id: applications[1].id,
        name: "Mike Rodriguez",
        title: "CTO",
        email: "mike@startuphub.io",
        linkedin_url: "https://linkedin.com/in/mikerodriguez",
        notes: "Direct hiring manager. Met at conference last year."
      }),
      db.contacts.create({
        job_application_id: applications[2].id,
        name: "Emily Watson",
        title: "HR Manager",
        email: "ewatson@digitaldynamics.com",
        phone: "+1-212-555-0456",
        notes: "Handles scheduling for technical interviews."
      }),
      db.contacts.create({
        job_application_id: applications[2].id,
        name: "James Park",
        title: "Engineering Director",
        email: "jpark@digitaldynamics.com",
        linkedin_url: "https://linkedin.com/in/jamespark",
        notes: "Would be my direct manager. Seems very technical."
      }),
      db.contacts.create({
        job_application_id: applications[3].id,
        name: "Dr. Lisa Kumar",
        title: "Head of ML",
        email: "lisa@aiinnovations.ai",
        notes: "Brilliant researcher. Published several papers I've read."
      })
    ]
    contacts.forEach((c) => console.log(`   ✓ ${c.name} (${c.title})`))
    console.log()

    // Create notes
    console.log("📝 Creating notes...")
    const notes = [
      db.notes.create({
        job_application_id: applications[0].id,
        content: "Submitted application through company portal. Resume tailored for frontend focus.",
        type: "general"
      }),
      db.notes.create({
        job_application_id: applications[1].id,
        content: "Phone screen with Mike went great! He liked my open source contributions.",
        type: "interview"
      }),
      db.notes.create({
        job_application_id: applications[2].id,
        content: "Technical interview covered system design, AWS, and microservices. Felt confident.",
        type: "interview"
      }),
      db.notes.create({
        job_application_id: applications[2].id,
        content: "Need to review CAP theorem and distributed consensus before final round.",
        type: "followup"
      }),
      db.notes.create({
        job_application_id: applications[3].id,
        content: "Offer details: $150k base, 0.1% equity, standard benefits. 2 weeks to decide.",
        type: "feedback"
      }),
      db.notes.create({
        job_application_id: applications[4].id,
        content: "Rejection email received. They suggested applying again in 6 months after gaining more experience.",
        type: "feedback"
      })
    ]
    console.log(`   ✓ Created ${notes.length} notes\n`)

    // Create tasks
    console.log("✅ Creating tasks...")
    const tasks = [
      db.tasks.create({
        job_application_id: applications[0].id,
        title: "Send follow-up email to Sarah",
        description: "Follow up on application status after 1 week",
        due_date: daysFromNow(5),
        is_completed: false
      }),
      db.tasks.create({
        job_application_id: applications[1].id,
        title: "Prepare for technical interview",
        description: "Review Node.js, React, and system design basics",
        due_date: daysFromNow(3),
        is_completed: false
      }),
      db.tasks.create({
        job_application_id: applications[2].id,
        title: "Complete take-home assignment",
        description: "Cloud architecture design document",
        due_date: daysFromNow(2),
        is_completed: false
      }),
      db.tasks.create({
        job_application_id: applications[2].id,
        title: "Research company culture",
        description: "Check Glassdoor reviews and reach out to current employees",
        due_date: daysFromNow(4),
        is_completed: false
      }),
      db.tasks.create({
        job_application_id: applications[3].id,
        title: "Review offer letter with lawyer",
        description: "Ensure equity terms are standard",
        due_date: daysFromNow(7),
        is_completed: false
      }),
      db.tasks.create({
        job_application_id: applications[3].id,
        title: "Negotiate start date",
        description: "Ask for 3 weeks instead of 2",
        due_date: daysFromNow(3),
        is_completed: false
      }),
      db.tasks.create({
        job_application_id: applications[0].id,
        title: "Connect with team member on LinkedIn",
        description: "Found a current frontend engineer to get insights",
        due_date: daysAgo(1),
        is_completed: true
      })
    ]

    // Mark the completed task
    if (tasks[6].is_completed) {
      db.tasks.markComplete(tasks[6].id)
    }

    console.log(`   ✓ Created ${tasks.length} tasks (${tasks.filter((t) => t.is_completed).length} completed)\n`)

    // Create activity logs
    console.log("📊 Creating activity logs...")
    const logs = [
      db.activityLogs.logActivity(
        user.id,
        "created",
        "job_application",
        applications[0].id,
        applications[0].id,
        { position: applications[0].position_title }
      ),
      db.activityLogs.logActivity(
        user.id,
        "status_changed",
        "job_application",
        applications[1].id,
        applications[1].id,
        { from: "applied", to: "screening" }
      ),
      db.activityLogs.logActivity(
        user.id,
        "status_changed",
        "job_application",
        applications[2].id,
        applications[2].id,
        { from: "screening", to: "interview" }
      ),
      db.activityLogs.logActivity(
        user.id,
        "received_offer",
        "job_application",
        applications[3].id,
        applications[3].id,
        { salary: 150000, equity: "0.1%" }
      ),
      db.activityLogs.logActivity(
        user.id,
        "added_contact",
        "contact",
        contacts[0].id,
        applications[0].id,
        { contact_name: contacts[0].name }
      ),
      db.activityLogs.logActivity(
        user.id,
        "completed_task",
        "task",
        tasks[6].id,
        applications[0].id,
        { task_title: tasks[6].title }
      ),
      db.activityLogs.logActivity(
        user.id,
        "application_rejected",
        "job_application",
        applications[4].id,
        applications[4].id,
        { reason: "Insufficient experience" }
      ),
      db.activityLogs.logActivity(
        user.id,
        "application_withdrawn",
        "job_application",
        applications[5].id,
        applications[5].id,
        { reason: "Not ready for management" }
      )
    ]
    console.log(`   ✓ Created ${logs.length} activity logs\n`)

    // Print summary
    console.log("📈 Seed Summary:")
    console.log("   ├─ 1 user (demo@jobtracker.com / demo123)")
    console.log(`   ├─ ${companies.length} companies`)
    console.log(`   ├─ ${applications.length} job applications (all statuses)`)
    console.log(`   ├─ ${tags.length} tags with colors`)
    console.log(`   ├─ ${contacts.length} contacts`)
    console.log(`   ├─ ${notes.length} notes`)
    console.log(`   ├─ ${tasks.length} tasks`)
    console.log(`   └─ ${logs.length} activity logs`)

    console.log("\n✅ Database seeded successfully!\n")
    console.log("🚀 You can now log in with:")
    console.log("   Email: demo@jobtracker.com")
    console.log("   Password: demo123\n")
  } catch (error) {
    console.error("\n❌ Seed failed:", error)
    throw error
  } finally {
    closeDatabase()
  }
}

// Run seed if called directly
if (require.main === module) {
  seed().catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
}

export default seed

