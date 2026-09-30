import 'dotenv/config';
import { query } from './src/config/database.js';
import { CertificateModel } from './src/models/certificate.model.js';

async function main() {
  const usersRes = await query(`SELECT id FROM "public"."users" WHERE role = 'STUDENT' LIMIT 1`);
  const studentId = usersRes.rows[0].id;
  
  const courseRes = await query(`SELECT id FROM "public"."courses" LIMIT 1`);
  const courseId = courseRes.rows[0].id;

  console.log(`Student: ${studentId}, Course: ${courseId}`);

  // Call issueCertificate directly
  try {
    const profileRes = await query(`SELECT id FROM "public"."student_profiles" WHERE "userId" = $1 LIMIT 1`, [studentId]);
    const studentProfileId = profileRes.rows[0].id;
    const cert = await CertificateModel.issueCertificate(studentProfileId, courseId, 'A1', 100);
    console.log('Cert:', cert);
  } catch (err) {
    console.error('Failed to issue cert:', err.message);
  }
  
  const certs = await CertificateModel.getStudentCertificates(studentId);
  console.log('Certificates:', certs);

  process.exit(0);
}

main().catch(console.error);
