import { PrismaClient, Role, UserStatus, CEFRLevel, SkillType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clean existing seed records if needed
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@platform.com',
          'teacher@platform.com',
          'student@platform.com',
        ],
      },
    },
  });

  const defaultPasswordHash = await bcrypt.hash('Password123!', 12);

  // 2. Create Superadmin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@platform.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Platform',
      lastName: 'Superadmin',
      role: Role.SUPERADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
    },
  });
  console.log(`✅ Superadmin created: ${admin.email}`);

  // 3. Create Verified Teacher User & Profile
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@platform.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
      isVerified: true,
      teacherProfile: {
        create: {
          headline: 'Certified CELTA English Instructor (10+ Yrs Experience)',
          bio: 'Passionate about helping students achieve natural fluency and confidence in business and everyday English.',
          qualifications: ['CELTA Certificate', 'MA in Applied Linguistics', 'BA in English Literature'],
          specialties: ['Business English', 'Grammar Mastery', 'Pronunciation & Accent Training'],
          experienceYears: 10,
          hourlyRate: 35.0,
          isApproved: true,
          approvalDate: new Date(),
        },
      },
    },
    include: { teacherProfile: true },
  });
  console.log(`✅ Teacher created: ${teacher.email}`);

  // 4. Create Active Student User & Profile
  const student = await prisma.user.create({
    data: {
      email: 'student@platform.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Alex',
      lastName: 'Kagabo',
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      isVerified: true,
      studentProfile: {
        create: {
          nativeLanguage: 'Kinyarwanda / French',
          currentLevel: CEFRLevel.A2,
          targetLevel: CEFRLevel.B2,
          learningGoals: ['Workplace Communication', 'Email Writing', 'Job Interview Readiness'],
        },
      },
    },
    include: { studentProfile: true },
  });
  console.log(`✅ Student created: ${student.email}`);

  // 5. Create Sample Course with Units & Lessons
  if (teacher.teacherProfile) {
    const starterCourse = await prisma.course.create({
      data: {
        title: 'A2 Elementary English: Practical Everyday & Workplace Fluency',
        slug: 'a2-elementary-practical-english',
        description:
          'A comprehensive step-by-step course covering vital grammar structures, everyday conversational patterns, listening comprehension, and practical workplace vocabulary.',
        summary: 'Build strong communicative competence at the CEFR A2 level.',
        level: CEFRLevel.A2,
        category: 'Communication English',
        currency: 'USD',
        durationDays: 90,
        isPublished: true,
        featured: true,
        teacherId: teacher.teacherProfile.id,
        units: {
          create: [
            {
              title: 'Unit 1: Introductions, Daily Routines & Present Tenses',
              description: 'Master present simple vs present continuous and talk about your day.',
              orderIndex: 1,
              lessons: {
                create: [
                  {
                    title: 'Lesson 1.1: Talking About Your Daily Schedule',
                    description: 'Express daily habits, routines, and frequency adverbs.',
                    skill: SkillType.SPEAKING,
                    orderIndex: 1,
                    estimatedMinutes: 25,
                    isFreePreview: true,
                    sections: {
                      create: [
                        {
                          title: 'Vocabulary & Phrases',
                          contentType: 'MARKDOWN',
                          content:
                            '### Key Vocabulary\n- **Every morning**: I always start work at 8:30 AM.\n- **Usually**: We usually hold team syncs on Mondays.\n- **Hardly ever**: I hardly ever skip lunch.',
                          orderIndex: 1,
                        },
                      ],
                    },
                  },
                  {
                    title: 'Lesson 1.2: Present Simple vs Present Continuous',
                    description: 'Learn when to use routine vs ongoing action tenses.',
                    skill: SkillType.GRAMMAR,
                    orderIndex: 2,
                    estimatedMinutes: 30,
                    sections: {
                      create: [
                        {
                          title: 'Grammar Rule Explanation',
                          contentType: 'MARKDOWN',
                          content:
                            '### Grammar Focus\n- **Present Simple**: Facts and permanent routines (*"I live in Kigali."*)\n- **Present Continuous**: Actions happening right now or temporary situations (*"I am studying English now."*)',
                          orderIndex: 1,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.log(`✅ Sample course seeded: ${starterCourse.title}`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
