/* eslint-disable no-console */
/// <reference types="node" />
import { PrismaClient, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.log('⚠ ADMIN_EMAIL and ADMIN_PASSWORD env vars not set — skipping admin seed.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Ensure existing user is admin + approved
    if (existing.role !== 'ADMIN' || existing.status !== 'APPROVED') {
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', status: 'APPROVED' },
      });
      console.log(`✓ Updated ${email} to ADMIN / APPROVED`);
    } else {
      console.log(`✓ Admin user ${email} already exists — skipping.`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, name, role: 'ADMIN', status: 'APPROVED' },
  });
  console.log(`✓ Admin user created: ${email}`);
}

const STATUSES: Status[] = [
  'WISHLIST', 'APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN',
];

const APPLICATIONS: { company: string; role: string; location: string; salary: string }[] = [
  { company: 'Stripe',        role: 'Senior Frontend Engineer',      location: 'Remote',            salary: '$160k–$190k' },
  { company: 'Vercel',        role: 'Software Engineer, DX',         location: 'Remote',            salary: '$140k–$170k' },
  { company: 'Linear',        role: 'Product Engineer',              location: 'San Francisco, CA', salary: '$150k–$180k' },
  { company: 'Notion',        role: 'Full Stack Engineer',           location: 'New York, NY',      salary: '$145k–$175k' },
  { company: 'Figma',         role: 'Frontend Engineer',             location: 'San Francisco, CA', salary: '$155k–$185k' },
  { company: 'GitHub',        role: 'Staff Engineer',                location: 'Remote',            salary: '$180k–$220k' },
  { company: 'Shopify',       role: 'Senior Backend Engineer',       location: 'Remote',            salary: '$150k–$180k' },
  { company: 'Cloudflare',    role: 'Software Engineer, Edge',       location: 'Austin, TX',        salary: '$140k–$165k' },
  { company: 'PlanetScale',   role: 'Developer Advocate',            location: 'Remote',            salary: '$130k–$155k' },
  { company: 'Tailscale',     role: 'Software Engineer',             location: 'Remote',            salary: '$145k–$170k' },
  { company: 'Supabase',      role: 'Full Stack Engineer',           location: 'Remote',            salary: '$120k–$150k' },
  { company: 'Railway',       role: 'Product Engineer',              location: 'Remote',            salary: '$125k–$155k' },
  { company: 'Loom',          role: 'Senior React Engineer',         location: 'San Francisco, CA', salary: '$150k–$180k' },
  { company: 'Retool',        role: 'Software Engineer II',          location: 'New York, NY',      salary: '$145k–$175k' },
  { company: 'Airtable',      role: 'Frontend Engineer',             location: 'San Francisco, CA', salary: '$155k–$185k' },
  { company: 'Datadog',       role: 'Software Engineer, UI',         location: 'New York, NY',      salary: '$160k–$195k' },
  { company: 'HashiCorp',     role: 'Senior Software Engineer',      location: 'Remote',            salary: '$155k–$185k' },
  { company: 'Deno',          role: 'Core Engineer',                 location: 'Remote',            salary: '$130k–$160k' },
  { company: 'Prisma',        role: 'Software Engineer',             location: 'Remote',            salary: '$125k–$155k' },
  { company: 'Nx',            role: 'Developer Experience Engineer', location: 'Remote',            salary: '$120k–$145k' },
];

const CONTACTS: { name: string; title: string; email: string }[] = [
  { name: 'Alice Chen',     title: 'Engineering Manager',    email: 'a.chen@stripe.com'      },
  { name: 'Ben Torres',     title: 'Senior Recruiter',       email: 'b.torres@vercel.com'    },
  { name: 'Clara Smith',    title: 'Tech Lead',              email: 'c.smith@linear.app'     },
  { name: 'David Kim',      title: 'Hiring Manager',         email: 'd.kim@notion.so'        },
  { name: 'Eva Müller',     title: 'Recruiter',              email: 'e.muller@figma.com'     },
  { name: 'Frank Zhang',    title: 'Director of Engineering',email: 'f.zhang@github.com'     },
  { name: 'Grace Lee',      title: 'Technical Recruiter',    email: 'g.lee@shopify.com'      },
  { name: 'Henry Park',     title: 'Engineering Manager',    email: 'h.park@cloudflare.com'  },
  { name: 'Iris Novak',     title: 'Head of Talent',         email: 'i.novak@planetscale.com'},
  { name: 'James Wu',       title: 'Staff Engineer',         email: 'j.wu@tailscale.com'     },
  { name: 'Karen Johansson',title: 'Recruiter',              email: 'k.johansson@supabase.io'},
  { name: 'Leo Fernandez',  title: 'Product Engineer',       email: 'l.fernandez@railway.app'},
  { name: 'Mia Tanaka',     title: 'Engineering Lead',       email: 'm.tanaka@loom.com'      },
  { name: 'Noah Patel',     title: 'Technical Recruiter',    email: 'n.patel@retool.com'     },
  { name: 'Olivia Brown',   title: 'Hiring Manager',         email: 'o.brown@airtable.com'   },
  { name: 'Paul Svensson',  title: 'Staff Engineer',         email: 'p.svensson@datadoghq.com'},
  { name: 'Quinn Adams',    title: 'Engineering Manager',    email: 'q.adams@hashicorp.com'  },
  { name: 'Rachel Scott',   title: 'Senior Recruiter',       email: 'r.scott@deno.com'       },
  { name: 'Sam Okafor',     title: 'Tech Lead',              email: 's.okafor@prisma.io'     },
  { name: 'Tina Kovac',     title: 'Recruiter',              email: 't.kovac@nx.dev'         },
];

function randomStatus(): Status {
  return STATUSES[Math.floor(Math.random() * STATUSES.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  await seedAdmin();

  const email = process.argv[2];
  if (!email) {
    console.log('No user email argument provided — skipping demo data seed.');
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Seeding 20 applications + contacts for ${user.name} (${user.email})...`);

  for (let i = 0; i < 20; i++) {
    const appData = APPLICATIONS[i];
    const contactData = CONTACTS[i];
    const status = randomStatus();
    const appliedAt = daysAgo(Math.floor(Math.random() * 60) + 1);

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        company: appData.company,
        role: appData.role,
        location: appData.location,
        salary: appData.salary,
        status,
        appliedAt,
        statusHistory: {
          create: { fromStatus: null, toStatus: status },
        },
      },
    });

    await prisma.contact.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        name: contactData.name,
        title: contactData.title,
        email: contactData.email,
      },
    });

    console.log(`  ✓ ${appData.company} — ${appData.role} [${status}]`);
  }

  console.log('\nDone! 20 applications and 20 contacts created.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
