package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.dto.user.*;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    //회원가입
    @Transactional
    public long signUp(SignupRequest dto) {

        if(userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 사용중인 이메일 입니다. : " + dto.getEmail());
        }

        String encodedPassword = passwordEncoder.encode(dto.getPassword());

        User user = User.builder()
                .email(dto.getEmail())
                .password(encodedPassword)
                .name(dto.getName())
                .role(dto.getRole() != null ? dto.getRole() : Role.USER) // 가입시 선택 권한 적용 (USER, EXPERT, ADMIN)
                .build();

        return  userRepository.save(user).getId();
    }

    //(일반/전문가/관리자)별 맞춤 로그인
    public UserResponse login(LoginRequest dto) {

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일 입니다."));

        if(!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        //로그인 시도한 탭의 권한이 실제 계정 권한과 일치한지 여부 확인
        if(user.getRole() != dto.getRole()) {
            throw new SecurityException("해당 로그인 탭 ["+user.getRole()+"] 으로 접근할 수 없는 계정입니다.");
        }

        return new UserResponse(user);
    }

    //프로필 단건 조회
    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다. ID : " + userId));
        return new UserResponse(user);
    }

    //프로필 정보 수정(이름 변경)
    @Transactional
    public void updateProfile(Long userId, UserProfileUpdateRequest dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다. ID : " + userId));

        user.updateProfile(dto.getName());
    }

    //이메일 수정
    @Transactional
    public void updateEmail(Long userId, UserEmailUpdateRequest dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다. ID : " + userId));

        if(userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 사용중인 이메일 입니다.");
        }

        user.updateEmail(dto.getEmail());
    }

    //비밀번호 변경
    @Transactional
    public void updatePassword(Long userId, UserPasswordUpdateRequest dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다. ID : " + userId));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        String encodedNewPassword = passwordEncoder.encode(dto.getNewPassword());
        user.updatePassword(encodedNewPassword);
    }

    //회원 탈퇴
    @Transactional

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원이 존재하지 않습니다. id=" + userId));

        userRepository.delete(user);
    }
}
