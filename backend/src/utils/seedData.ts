import { supabaseAdmin } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to generate random date within range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Helper to generate random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Get or create organization
    console.log('📦 Step 1: Setting up organization...');
    let { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('name', '2XG')
      .single();

    if (orgError || !org) {
      const { data: newOrg } = await supabaseAdmin
        .from('organizations')
        .insert({ name: '2XG', logo_url: '/logo.png' })
        .select()
        .single();
      org = newOrg!;
    }
    console.log('✅ Organization ready:', org.name);

    // 2. Create Admin User (Moved to top priority)
    console.log('\n📦 Step 2: Creating admin user...');
    const adminEmail = 'mohd.zaheer@gmail.com';
    const adminPassword = 'admin123';

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (!existingUser) {
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          organization_id: org.id, // Ensure org_id is linked if schema requires it
          name: 'Zaheer Admin',
          email: adminEmail,
          password_hash: passwordHash,
          role: 'Admin',
          phone: '+919876543210',
          department: 'Management',
          status: 'Active'
        });

      if (userError) {
        console.error('Error creating admin user:', userError);
      } else {
        console.log(`✅ Admin user created: ${adminEmail}`);
      }
    } else {
      console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
      // Force update password to ensure it is 'admin123'
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: passwordHash, status: 'Active' })
        .eq('email', adminEmail);

      if (updateError) {
        console.error('Error updating admin password:', updateError);
      } else {
        console.log(`✅ Admin password reset to: ${adminPassword}`);
      }
    }

    // 3. Create product categories
    const categories = ['Electric Bikes', 'Geared Cycles', 'Premium MTB', 'Single Speed', 'Kids Bikes'];
    const categoryData = [];

    for (const name of categories) {
      // Check if category already exists
      const { data: existing } = await supabaseAdmin
        .from('product_categories')
        .select('*')
        .eq('organization_id', org.id)
        .eq('name', name)
        .single();

      if (existing) {
        categoryData.push(existing);
      } else {
        const { data } = await supabaseAdmin
          .from('product_categories')
          .insert({ organization_id: org.id, name })
          .select()
          .single();
        if (data) categoryData.push(data);
      }
    }
    console.log(`✅ Created ${categoryData.length} categories`);

    // 3. Generate sales transactions (last 6 months)
    console.log('\n📦 Step 3: Generating sales transactions...');
    const salesData = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();

    const customerNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Rahul Singh',
      'Anita Desai', 'Vikram Mehta', 'Neha Agarwal', 'Sanjay Verma', 'Pooja Reddy',
      'Arjun Nair', 'Kavita Joshi', 'Deepak Rao', 'Meera Iyer', 'Karthik Menon'
    ];

    for (let i = 0; i < 150; i++) {
      const transactionDate = randomDate(startDate, endDate);
      const category = randomElement(categoryData);
      const amount = Math.floor(Math.random() * 40000) + 15000; // 15k to 55k
      const paymentStatus = Math.random() > 0.85 ? 'overdue' : (Math.random() > 0.5 ? 'paid' : 'partial');
      const dueAmount = paymentStatus === 'paid' ? 0 : Math.floor(amount * (Math.random() * 0.4 + 0.1));

      salesData.push({
        organization_id: org.id,
        category_id: category.id,
        transaction_date: transactionDate,
        invoice_number: `INV-${2024000 + i}`,
        customer_name: randomElement(customerNames),
        amount,
        due_amount: dueAmount,
        payment_status: paymentStatus
      });
    }

    await supabaseAdmin.from('sales_transactions').insert(salesData);
    console.log(`✅ Created ${salesData.length} sales transactions`);

    // 4. Generate inventory items
    console.log('\n📦 Step 4: Creating inventory items...');
    const products = [
      { name: 'Electric Bike Model A', price: 45000 },
      { name: 'Electric Bike Model B', price: 52000 },
      { name: 'Geared Cycle Pro', price: 12000 },
      { name: 'Geared Cycle Elite', price: 15000 },
      { name: 'Premium MTB X1', price: 28000 },
      { name: 'Premium MTB X2', price: 32000 },
      { name: 'Single Speed Classic', price: 8000 },
      { name: 'Single Speed Sport', price: 9500 },
      { name: 'Kids Bike 16"', price: 5500 },
      { name: 'Kids Bike 20"', price: 6500 }
    ];

    const inventoryData = products.map((product, i) => ({
      organization_id: org.id,
      product_name: product.name,
      sku: `SKU-${1000 + i}`,
      current_stock: Math.floor(Math.random() * 45) + 5,
      reorder_point: 15,
      unit_price: product.price,
      sales_count: Math.floor(Math.random() * 180) + 20
    }));

    await supabaseAdmin.from('inventory_items').insert(inventoryData);
    console.log(`✅ Created ${inventoryData.length} inventory items`);

    // 5. Generate shipments
    console.log('\n📦 Step 5: Creating shipments...');
    const shipmentData = [];

    for (let i = 0; i < 40; i++) {
      const type = Math.random() > 0.7 ? 'spare' : 'regular';
      const status = Math.random() > 0.3 ? 'received' : 'pending';
      const expectedDate = randomDate(startDate, endDate);

      shipmentData.push({
        organization_id: org.id,
        shipment_number: `SHIP-${3000 + i}`,
        shipment_type: type,
        status: status,
        expected_date: expectedDate,
        received_date: status === 'received' ? expectedDate : null
      });
    }

    await supabaseAdmin.from('shipments').insert(shipmentData);
    console.log(`✅ Created ${shipmentData.length} shipments`);

    // 6. Generate deliveries
    console.log('\n📦 Step 6: Creating deliveries...');
    const deliveryTypes = ['cycle_delivered', 'pickup_pending', 'pickup_cleared', 'outside_delivery'];
    const deliveryData = [];

    for (let i = 0; i < 60; i++) {
      const type = randomElement(deliveryTypes);
      const status = (type === 'pickup_pending') ? 'pending' : 'completed';
      const deliveryDate = randomDate(startDate, endDate);

      deliveryData.push({
        organization_id: org.id,
        delivery_number: `DEL-${4000 + i}`,
        delivery_type: type,
        delivery_date: deliveryDate,
        customer_name: randomElement(customerNames),
        address: `Address ${i + 1}, Mumbai`,
        status: status
      });
    }

    await supabaseAdmin.from('deliveries').insert(deliveryData);
    console.log(`✅ Created ${deliveryData.length} deliveries`);

    // 7. Generate service tickets
    console.log('\n📦 Step 7: Creating service tickets...');
    const issueCategories = ['Electrical', 'Mechanical', 'Brake Issue', 'Tire Replacement', 'General Service'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['open', 'in_progress', 'resolved', 'closed'];
    const ticketData = [];

    for (let i = 0; i < 80; i++) {
      const raisedDate = randomDate(startDate, endDate);
      const status = randomElement(statuses);

      ticketData.push({
        organization_id: org.id,
        ticket_number: `TKT-${5000 + i}`,
        customer_name: randomElement(customerNames),
        issue_category: randomElement(issueCategories),
        description: `Service request for ${randomElement(issueCategories).toLowerCase()}`,
        status: status,
        priority: randomElement(priorities),
        raised_date: raisedDate,
        resolved_date: (status === 'resolved' || status === 'closed') ? raisedDate : null
      });
    }

    await supabaseAdmin.from('service_tickets').insert(ticketData);
    console.log(`✅ Created ${ticketData.length} service tickets`);

    // 8. Generate CRM leads
    console.log('\n📦 Step 8: Creating CRM leads...');
    const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
    const leadSources = ['website', 'referral', 'direct', 'social_media', 'advertisement'];
    const leadData = [];

    for (let i = 0; i < 100; i++) {
      const leadDate = randomDate(startDate, endDate);
      const status = randomElement(leadStatuses);
      const expectedValue = Math.floor(Math.random() * 50000) + 10000;

      leadData.push({
        organization_id: org.id,
        customer_name: randomElement(customerNames),
        customer_phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customer_email: `customer${i}@example.com`,
        lead_source: randomElement(leadSources),
        status: status,
        expected_value: expectedValue,
        lead_date: leadDate
      });
    }

    await supabaseAdmin.from('crm_leads').insert(leadData);
    console.log(`✅ Created ${leadData.length} CRM leads`);



    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`- Sales Transactions: ${salesData.length}`);
    console.log(`- Inventory Items: ${inventoryData.length}`);
    console.log(`- Shipments: ${shipmentData.length}`);
    console.log(`- Deliveries: ${deliveryData.length}`);
    console.log(`- Service Tickets: ${ticketData.length}`);
    console.log(`- CRM Leads: ${leadData.length}`);
    console.log('\n✨ Your 2XG Dashboard is ready to use!\n');

  } catch (error: any) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding
seedDatabase();
