package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.dto.inquiry.InquiryRequestDto;
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

    @Transactional(readOnly = true)
    public List<Inquiry> getAllInquiries() {
        return inquiryRepository.findAll();
    }

    @Transactional
    public void updateInquiryStatus(Long id, String status) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다. ID: " + id));

        inquiry.setStatus(status);
    }
}