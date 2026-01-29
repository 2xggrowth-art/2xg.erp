import { supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function debugUser() {
    console.log('🔍 Starting User Diagnostics...');
    const email = 'mohd.zaheer@gmail.com';
    const password = 'admin123';

    try {
        // 1. Fetch User
        console.log(`\n1. Fetching user with email: ${email}`);
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            console.error('❌ Error fetching user:', error.message);
            return;
        }

        if (!user) {
            console.error('❌ User not found in database!');
            return;
        }

        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password Hash (first 20 chars): ${user.password_hash?.substring(0, 20)}...`);

        // 2. Verify Password
        console.log(`\n2. Verifying password: "${password}"`);
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            console.log('✅ Password VALID! The hash in the DB matches "admin123".');
        } else {
            console.error('❌ Password INVALID! The hash in the DB does NOT match "admin123".');

            // 3. Attempt Fix
            console.log('\n3. Attempting to fix password via diagnostic pass...');
            const newHash = await bcrypt.hash(password, 10);
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ password_hash: newHash })
                .eq('id', user.id);

            if (updateError) {
                console.error('❌ Failed to update password:', updateError.message);
            } else {
                console.log('✅ Password updated successfully to a fresh hash.');
                // Re-verify
                const reMatch = await bcrypt.compare(password, newHash);
                console.log(`   Re-verification: ${reMatch ? 'SUCCESS' : 'FAILED'}`);
            }
        }

    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
    }
}

debugUser();
