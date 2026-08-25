package com.learn.playground.m10core;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Module 10 — AOP.
 *
 * Đo thời gian chạy mà KHÔNG phải sửa một dòng nào trong service.
 * Gọi /m10/aop rồi nhìn console để thấy aspect chạy.
 *
 * Nhớ: Spring cài AOP bằng PROXY -> gọi method nội bộ trong cùng class thì aspect
 * (và @Transactional, @Cacheable, @Async) KHÔNG chạy. Xem SelfInvocationService.
 */
@Aspect
@Component
public class TimingAspect {

    private static final Logger log = LoggerFactory.getLogger(TimingAspect.class);

    /** Annotation riêng: chỉ method nào đánh dấu mới bị đo. */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Timed { }

    @Pointcut("@annotation(com.learn.playground.m10core.TimingAspect.Timed)")
    public void timedMethods() { }

    @Around("timedMethods()")
    public Object measure(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();                       // gọi method gốc
        } finally {
            double ms = (System.nanoTime() - start) / 1e6;
            log.info("[AOP] {} chạy hết {} ms", pjp.getSignature().toShortString(), String.format("%.1f", ms));
        }
    }

    /** Ghi log mọi exception ném ra từ tầng service — không cần try/catch rải rác. */
    @org.aspectj.lang.annotation.AfterThrowing(
            pointcut = "within(com.learn.playground..*Service)", throwing = "ex")
    public void logError(org.aspectj.lang.JoinPoint jp, Throwable ex) {
        log.warn("[AOP] {} ném {}: {}", jp.getSignature().toShortString(),
                ex.getClass().getSimpleName(), ex.getMessage());
    }
}
