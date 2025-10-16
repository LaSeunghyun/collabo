-- Artist Funding Collaboration Platform Database Schema
-- This file contains the complete database schema for the platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('creator', 'participant', 'partner')),
    avatar TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artists table (extends users for creators)
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    bio TEXT,
    profile_image TEXT,
    cover_image TEXT,
    location VARCHAR(255),
    join_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    total_funded BIGINT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    target_amount BIGINT NOT NULL,
    current_amount BIGINT DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    days_left INTEGER NOT NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('reward', 'revenue', 'both')),
    verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table (for reward-based projects)
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    items TEXT[] NOT NULL,
    delivery_date DATE NOT NULL,
    popular BOOLEAN DEFAULT FALSE,
    limited INTEGER,
    available_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts table
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_hot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participations table
CREATE TABLE participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('reward', 'revenue')),
    amount BIGINT NOT NULL,
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    participant_info JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table (for posts and comments)
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT likes_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Follows table (artist following)
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, artist_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_artist_id ON projects(artist_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_participations_project_id ON participations(project_id);
CREATE INDEX idx_participations_user_id ON participations(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_artist_id ON follows(artist_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET likes = likes + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET views = views + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET comments = comments + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET comments = GREATEST(comments - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participations_updated_at BEFORE UPDATE ON participations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for comment counting
CREATE OR REPLACE FUNCTION handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM increment_comments(NEW.post_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM decrement_comments(OLD.post_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION handle_comment_count();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read all users, but only update their own
CREATE POLICY "Users can read all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Artists can be read by all
CREATE POLICY "Anyone can read artists" ON artists
    FOR SELECT USING (true);

CREATE POLICY "Artists can update own profile" ON artists
    FOR UPDATE USING (auth.uid() = id);

-- Projects can be read by all
CREATE POLICY "Anyone can read projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Creators can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Project creators can update their projects" ON projects
    FOR UPDATE USING (auth.uid() = artist_id);

-- Community posts can be read by all
CREATE POLICY "Anyone can read community posts" ON community_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON community_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON community_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Comments can be read by all
CREATE POLICY "Anyone can read comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = author_id);

-- Participations can be read by the user and project creator
CREATE POLICY "Users can read own participations" ON participations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Project creators can read project participations" ON participations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = participations.project_id 
            AND projects.artist_id = auth.uid()
        )
    );

CREATE POLICY "Users can create participations" ON participations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes can be read by the user
CREATE POLICY "Users can read own likes" ON likes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Follows can be read by the user
CREATE POLICY "Users can read own follows" ON follows
    FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Users can create follows" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Notifications can be read by the user
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample data
INSERT INTO users (id, name, email, role, verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '라이트닝 밴드', 'lightning@example.com', 'creator', true),
    ('550e8400-e29b-41d4-a716-446655440001', '김서영', 'kim@example.com', 'creator', false),
    ('550e8400-e29b-41d4-a716-446655440002', '이준혁', 'lee@example.com', 'creator', true),
    ('550e8400-e29b-41d4-a716-446655440003', '박준호', 'park@example.com', 'creator', true),
    ('550e8400-e29b-41d4-a716-446655440004', '정수민', 'jung@example.com', 'creator', false),
    ('550e8400-e29b-41d4-a716-446655440005', '춤추는그림단', 'dance@example.com', 'creator', true);

INSERT INTO artists (id, name, genre, bio, profile_image, cover_image, location, join_date, is_verified, followers, total_funded, success_rate) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '라이트닝 밴드', '인디록', '5년간 함께해온 인디 밴드입니다.', '', '', '서울', '2020-01-15', true, 1240, 15000000, 85.5),
    ('550e8400-e29b-41d4-a716-446655440001', '김서영', '시각예술', '도시의 일상을 담는 화가입니다.', '', '', '부산', '2021-03-20', false, 890, 5000000, 72.3),
    ('550e8400-e29b-41d4-a716-446655440002', '이준혁', '영상', '로컬 스토리를 기록하는 다큐멘터리 작가입니다.', '', '', '대구', '2019-11-10', true, 567, 12000000, 90.1),
    ('550e8400-e29b-41d4-a716-446655440003', '박준호 & 김민재', '음악', '클래식과 재즈의 만남을 추구하는 듀오입니다.', '', '', '서울', '2022-06-05', true, 234, 3000000, 78.9),
    ('550e8400-e29b-41d4-a716-446655440004', '정수민', '사진', '청춘의 순간을 담는 사진작가입니다.', '', '', '광주', '2023-02-14', false, 123, 1500000, 65.2),
    ('550e8400-e29b-41d4-a716-446655440005', '춤추는그림단', '공연예술', '현대무용과 라이브 페인팅을 결합한 퍼포먼스 그룹입니다.', '', '', '서울', '2021-09-30', true, 456, 8000000, 88.7);

-- Update projects table to reference artists
UPDATE projects SET artist_id = '550e8400-e29b-41d4-a716-446655440000' WHERE id = '1';
UPDATE projects SET artist_id = '550e8400-e29b-41d4-a716-446655440001' WHERE id = '2';
UPDATE projects SET artist_id = '550e8400-e29b-41d4-a716-446655440002' WHERE id = '3';
UPDATE projects SET artist_id = '550e8400-e29b-41d4-a716-446655440003' WHERE id = '4';
UPDATE projects SET artist_id = '550e8400-e29b-41d4-a716-446655440004' WHERE id = '5';
UPDATE projects SET artist_id = '550e8400-e29b-41d4-a716-446655440005' WHERE id = '6';

