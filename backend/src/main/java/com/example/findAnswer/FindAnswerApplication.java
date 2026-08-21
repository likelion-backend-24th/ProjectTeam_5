package com.example.findAnswer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
public class FindAnswerApplication {

	public static void main(String[] args) {
		// 서버 OS/컨테이너 기본 타임존과 무관하게 LocalDateTime.now()가 항상 한국 시간을 쓰도록 고정한다.
		// (배포 환경은 보통 UTC가 기본값이라, 이걸 안 하면 저장되는 시각이 실제보다 9시간 느려진다.)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		SpringApplication.run(FindAnswerApplication.class, args);
	}

}
