package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.dto.Inquiry.InquiryRequestDto;
import com.example.findAnswer.mentorbridge.entity.Inquiry;
import com.example.findAnswer.mentorbridge.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;

    @Transactional
    public void createInquiry(InquiryRequestDto dto) {
        Inquiry inquiry = new Inquiry();
        inquiry.setCategory(dto.getCategory());
        inquiry.setEmail(dto.getEmail());
        inquiry.setTitle(dto.getTitle());
        inquiry.setContent(dto.getContent());

        inquiryRepository.save(inquiry);
    }

    //관리자용 문의 목록 조회
    @Transactional(readOnly = true)
    public List<Inquiry> getAllInquiries() {
        return inquiryRepository.findAll();
    }

    //관리자용 문의 상태 변경
    @Transactional
    public void updateInquiryStatus(Long id, String status) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 문의를 찾을 수 없습니다. ID: " + id));

        inquiry.setStatus(status); // Inquiry 엔티티에 status 필드와 setStatus 메서드가 있어야 합니다.
        inquiryRepository.save(inquiry);
    }
}