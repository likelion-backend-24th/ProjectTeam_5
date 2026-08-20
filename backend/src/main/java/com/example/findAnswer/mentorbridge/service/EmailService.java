package com.example.findAnswer.mentorbridge.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    public void sendVerificationEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[MentorBridge] 멘토 신청 이메일 인증 번호입니다.");
        message.setText("안녕하세요! MentorBridge 입니다.\n\n" +
                "요청하신 이메일 인증 번호는 아래와 같습니다.\n\n" +
                "인증 번호: [" + code + "]\n\n" +
                "해당 번호를 홈페이지 인증 화면에 입력해 주세요. (5분 후 만료됩니다.)");

        javaMailSender.send(message);
    }
}