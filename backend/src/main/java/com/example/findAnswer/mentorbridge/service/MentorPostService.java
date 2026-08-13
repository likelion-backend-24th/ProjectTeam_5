package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPost;
import com.example.findAnswer.mentorbridge.repository.MentorPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorPostService {

    private final MentorPostRepository mentorPostRepository;

    // 게시글 작성 (멘토 본인)
    @Transactional
    public MentorPostResponse createPost(Long mentorId, MentorPostRequest request) {
        MentorPost post = MentorPost.builder()
                .mentorId(mentorId)
                .title(request.title())
                .content(request.content())
                .build();

        return MentorPostResponse.from(mentorPostRepository.save(post));
    }

    // 게시글 수정 (멘토 본인)
    @Transactional
    public MentorPostResponse updatePost(Long mentorId, Long postId, MentorPostRequest request) {
        MentorPost post = mentorPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getMentorId().equals(mentorId)) {
            throw new IllegalArgumentException("본인의 게시글만 수정할 수 있습니다.");
        }

        post.update(request.title(), request.content());
        return MentorPostResponse.from(post);
    }

    // 게시글 삭제 (멘토 본인)
    @Transactional
    public void deletePost(Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getMentorId().equals(mentorId)) {
            throw new IllegalArgumentException("본인의 게시글만 삭제할 수 있습니다.");
        }

        mentorPostRepository.delete(post);
    }

    // 💡 [수정] 게시글 단건 조회 시 mentorId도 함께 검증하도록 변경
    public MentorPostResponse getPost(Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findByIdAndMentorId(postId, mentorId)
                .orElseThrow(() -> new IllegalArgumentException("해당 멘토의 게시글을 찾을 수 없습니다."));
        return MentorPostResponse.from(post);
    }
}