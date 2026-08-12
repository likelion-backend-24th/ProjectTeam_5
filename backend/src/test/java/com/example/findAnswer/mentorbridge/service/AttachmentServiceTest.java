package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.AttachmentFileType;
import com.example.findAnswer.mentorbridge.constants.AttachmentStatus;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignRequest;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignResponse;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignedUpload;
import com.example.findAnswer.mentorbridge.entity.QuestionAttachmentFile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.exception.UnsupportedFileTypeException;
import com.example.findAnswer.mentorbridge.repository.QuestionAttachmentFileRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.storage.AttachmentStorage;
import org.apache.tomcat.util.http.fileupload.InvalidFileNameException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("AttachmentService - 이미지 업로드 서명 발급")
class AttachmentServiceTest {

    @Mock
    AttachmentStorage attachmentStorage;

    @Mock
    QuestionAttachmentFileRepository questionAttachmentFileRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    AttachmentService attachmentService;

    private static final Long USER_ID = 1L;

    // 검증(확장자/용량/파일명)은 사용자 조회·저장보다 먼저 일어나므로,
    // 실패 케이스에서는 어떤 Mock도 스텁하지 않는다(불필요 스텁 = 엄격 모드 위반).
    @Nested
    @DisplayName("요청 검증에서 실패하면")
    class ValidationFailure {

        @Test
        @DisplayName("허용되지 않은 확장자면 UnsupportedFileTypeException을 던지고 저장하지 않는다")
        void 확장자_거부() {
            SignRequest request = new SignRequest("virus.exe", 1024L);

            assertThatThrownBy(() -> attachmentService.createImageUploadSignature(USER_ID, request))
                    .isInstanceOf(UnsupportedFileTypeException.class);

            verify(questionAttachmentFileRepository, never()).save(any());
            verify(attachmentStorage, never()).createSignedUpload(anyString());
        }

        @Test
        @DisplayName("5MB를 초과하면 FILE_TOO_LARGE로 거부한다")
        void 용량초과_거부() {
            long sixMB = 6L * 1024 * 1024;
            SignRequest request = new SignRequest("big.png", sixMB);

            assertThatThrownBy(() -> attachmentService.createImageUploadSignature(USER_ID, request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.FILE_TOO_LARGE);

            verify(questionAttachmentFileRepository, never()).save(any());
        }

        @Test
        @DisplayName("확장자가 없는 파일명이면 InvalidFileNameException을 던진다")
        void 확장자없음_거부() {
            SignRequest request = new SignRequest("noextension", 1024L);

            assertThatThrownBy(() -> attachmentService.createImageUploadSignature(USER_ID, request))
                    .isInstanceOf(InvalidFileNameException.class);

            verify(questionAttachmentFileRepository, never()).save(any());
        }
    }

    @Test
    @DisplayName("검증은 통과했지만 사용자가 없으면 USER_NOT_FOUND로 거부한다")
    void 사용자없음_거부() {
        SignRequest request = new SignRequest("photo.png", 1024L);
        given(userRepository.findById(USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> attachmentService.createImageUploadSignature(USER_ID, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);

        verify(questionAttachmentFileRepository, never()).save(any());
        verify(attachmentStorage, never()).createSignedUpload(anyString());
    }

    @Test
    @DisplayName("정상 요청이면 PENDING 상태로 저장하고, 발급받은 서명을 attachId와 함께 반환한다")
    void 정상_PENDING저장_서명반환() {
        // given
        SignRequest request = new SignRequest("photo.png", 2048L);

        User user = mock(User.class);
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

        // save()가 id가 채워진 엔티티를 돌려주도록 (실 DB의 IDENTITY 채번을 흉내)
        QuestionAttachmentFile savedEntity = QuestionAttachmentFile.builder()
                .id(42L)
                .uploader(user)
                .attachmentType(AttachmentFileType.IMAGE)
                .attachmentStatus(AttachmentStatus.PENDING)
                .storageKey("findanswer/posts/2026/08/uuid")
                .originalFileName("photo.png")
                .size(2048L)
                .build();
        given(questionAttachmentFileRepository.save(any(QuestionAttachmentFile.class)))
                .willReturn(savedEntity);

        SignedUpload signedUpload = new SignedUpload(
                "https://api.cloudinary.com/v1_1/demo/image/upload",
                "cloud-api-key", 1_700_000_000L, "signature-hash", "findanswer/posts/2026/08/uuid");
        given(attachmentStorage.createSignedUpload(anyString())).willReturn(signedUpload);

        // when
        SignResponse response = attachmentService.createImageUploadSignature(USER_ID, request);

        // then: 저장된 엔티티가 PENDING/IMAGE 이고 storageKey 규칙을 따른다
        ArgumentCaptor<QuestionAttachmentFile> captor =
                ArgumentCaptor.forClass(QuestionAttachmentFile.class);
        verify(questionAttachmentFileRepository).save(captor.capture());
        QuestionAttachmentFile toSave = captor.getValue();
        assertThat(toSave.getAttachmentStatus()).isEqualTo(AttachmentStatus.PENDING);
        assertThat(toSave.getAttachmentType()).isEqualTo(AttachmentFileType.IMAGE);
        assertThat(toSave.getOriginalFileName()).isEqualTo("photo.png");
        assertThat(toSave.getStorageKey()).startsWith("findanswer/posts/");

        // 저장 시 만든 storageKey로 서명을 요청한다
        verify(attachmentStorage).createSignedUpload(toSave.getStorageKey());

        // then: 응답에 저장된 id(attachId)와 서명 정보가 그대로 담긴다
        assertThat(response.attachId()).isEqualTo(42L);
        assertThat(response.uploadURL()).isEqualTo(signedUpload.uploadURL());
        assertThat(response.apiKey()).isEqualTo(signedUpload.apiKey());
        assertThat(response.timestamp()).isEqualTo(signedUpload.timestamp());
        assertThat(response.signature()).isEqualTo(signedUpload.signature());
        assertThat(response.publicId()).isEqualTo(signedUpload.publicId());
    }
}
