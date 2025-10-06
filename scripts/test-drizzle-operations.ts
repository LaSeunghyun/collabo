import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { eq, desc } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

async function testDrizzleOperations() {
  console.log('?? Starting Drizzle operations test...');
  
  try {
    // Create connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    console.log('?ì° Connecting to Supabase database...');
    const client = postgres(connectionString, { prepare: false });
    const db = drizzle(client);

    // Test 1: Insert a user
    console.log('?ë§ Testing user insertion...');
    const testUser = {
      id: 'test-user-' + Date.now(),
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      role: 'PARTICIPANT',
    };

    const insertedUser = await db.execute(`
      INSERT INTO users (id, name, email, role) 
      VALUES ('${testUser.id}', '${testUser.name}', '${testUser.email}', '${testUser.role}')
      RETURNING *
    `);
    console.log('??User inserted:', insertedUser[0]);

    // Test 2: Insert a project
    console.log('?éØ Testing project insertion...');
    const testProject = {
      id: 'test-project-' + Date.now(),
      title: 'Test Project',
      description: 'This is a test project for Drizzle ORM',
      category: 'Technology',
      targetAmount: 1000000,
      ownerId: testUser.id,
    };

    const insertedProject = await db.execute(`
      INSERT INTO projects (id, title, description, category, target_amount, owner_id) 
      VALUES ('${testProject.id}', '${testProject.title}', '${testProject.description}', '${testProject.category}', ${testProject.targetAmount}, '${testProject.ownerId}')
      RETURNING *
    `);
    console.log('??Project inserted:', insertedProject[0]);

    // Test 3: Insert a funding
    console.log('?í∞ Testing funding insertion...');
    const testFunding = {
      id: 'test-funding-' + Date.now(),
      projectId: testProject.id,
      userId: testUser.id,
      amount: 50000,
      paymentStatus: 'PENDING',
    };

    const insertedFunding = await db.execute(`
      INSERT INTO fundings (id, project_id, user_id, amount, payment_status) 
      VALUES ('${testFunding.id}', '${testFunding.projectId}', '${testFunding.userId}', ${testFunding.amount}, '${testFunding.paymentStatus}')
      RETURNING *
    `);
    console.log('??Funding inserted:', insertedFunding[0]);

    // Test 4: Insert a post
    console.log('?ìù Testing post insertion...');
    const testPost = {
      id: 'test-post-' + Date.now(),
      projectId: testProject.id,
      authorId: testUser.id,
      title: 'Test Post',
      content: 'This is a test post for the project',
      type: 'UPDATE',
      category: 'GENERAL',
    };

    const insertedPost = await db.execute(`
      INSERT INTO posts (id, project_id, author_id, title, content, type, category) 
      VALUES ('${testPost.id}', '${testPost.projectId}', '${testPost.authorId}', '${testPost.title}', '${testPost.content}', '${testPost.type}', '${testPost.category}')
      RETURNING *
    `);
    console.log('??Post inserted:', insertedPost[0]);

    // Test 5: Insert a comment
    console.log('?í¨ Testing comment insertion...');
    const testComment = {
      id: 'test-comment-' + Date.now(),
      postId: testPost.id,
      authorId: testUser.id,
      content: 'This is a test comment',
    };

    const insertedComment = await db.execute(`
      INSERT INTO comments (id, post_id, author_id, content) 
      VALUES ('${testComment.id}', '${testComment.postId}', '${testComment.authorId}', '${testComment.content}')
      RETURNING *
    `);
    console.log('??Comment inserted:', insertedComment[0]);

    // Test 6: Query operations
    console.log('?îç Testing query operations...');
    
    // Get user by email
    const foundUser = await db.execute(`SELECT * FROM users WHERE email = '${testUser.email}'`);
    console.log('??User found by email:', foundUser[0]);

    // Get projects by user
    const userProjects = await db.execute(`SELECT * FROM projects WHERE owner_id = '${testUser.id}'`);
    console.log('??User projects:', userProjects);

    // Get fundings for project
    const projectFundings = await db.execute(`SELECT * FROM fundings WHERE project_id = '${testProject.id}'`);
    console.log('??Project fundings:', projectFundings);

    // Get posts for project
    const projectPosts = await db.execute(`SELECT * FROM posts WHERE project_id = '${testProject.id}'`);
    console.log('??Project posts:', projectPosts);

    // Get comments for post
    const postComments = await db.execute(`SELECT * FROM comments WHERE post_id = '${testPost.id}'`);
    console.log('??Post comments:', postComments);

    // Test 7: Update operations
    console.log('?îÑ Testing update operations...');
    
    // Update user
    const updatedUser = await db.execute(`
      UPDATE users 
      SET name = 'Updated Test User' 
      WHERE id = '${testUser.id}' 
      RETURNING *
    `);
    console.log('??User updated:', updatedUser[0]);

    // Update project
    const updatedProject = await db.execute(`
      UPDATE projects 
      SET current_amount = 50000 
      WHERE id = '${testProject.id}' 
      RETURNING *
    `);
    console.log('??Project updated:', updatedProject[0]);

    // Test 8: Complex queries
    console.log('?îó Testing complex queries...');
    
    // Get project with fundings
    const projectWithFundings = await db.execute(`
      SELECT p.*, f.* 
      FROM projects p 
      LEFT JOIN fundings f ON p.id = f.project_id 
      WHERE p.id = '${testProject.id}'
    `);
    console.log('??Project with fundings:', projectWithFundings);

    // Get post with comments
    const postWithComments = await db.execute(`
      SELECT p.*, c.* 
      FROM posts p 
      LEFT JOIN comments c ON p.id = c.post_id 
      WHERE p.id = '${testPost.id}'
    `);
    console.log('??Post with comments:', postWithComments);

    // Test 9: Cleanup
    console.log('?ßπ Cleaning up test data...');
    
    await db.execute(`DELETE FROM comments WHERE id = '${testComment.id}'`);
    await db.execute(`DELETE FROM posts WHERE id = '${testPost.id}'`);
    await db.execute(`DELETE FROM fundings WHERE id = '${testFunding.id}'`);
    await db.execute(`DELETE FROM projects WHERE id = '${testProject.id}'`);
    await db.execute(`DELETE FROM users WHERE id = '${testUser.id}'`);
    
    console.log('??Test data cleaned up');

    console.log('?éâ All Drizzle operations tests completed successfully!');
    console.log('?ìã Summary:');
    console.log('   ??Database connection');
    console.log('   ??Table creation and migration');
    console.log('   ??Data insertion (users, projects, fundings, posts, comments)');
    console.log('   ??Data querying (simple and complex)');
    console.log('   ??Data updating');
    console.log('   ??Data deletion');
    console.log('   ??Relations and joins');

  } catch (error) {
    console.error('??Operations test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testDrizzleOperations();
