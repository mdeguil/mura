package io.mura.support;

import org.springframework.aop.framework.ProxyFactory;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.util.ArrayList;
import java.util.List;

/**
 * Wraps a service in the same transactional proxy Spring would give it, over
 * a transaction manager that only records how each transaction ended. It
 * tells whether a method's {@code @Transactional} commits or rolls back on a
 * given outcome, without a database.
 */
public final class TransactionProbe implements PlatformTransactionManager {

    private final List<String> outcomes = new ArrayList<>();

    /**
     * Returns the service behind a transactional proxy that reports to this
     * probe.
     *
     * @param target the service to wrap
     * @param <T> its type
     * @return the proxy, to call in place of the service
     */
    @SuppressWarnings("unchecked")
    public <T> T wrap(T target) {
        ProxyFactory factory = new ProxyFactory(target);
        factory.setProxyTargetClass(true);
        factory.addAdvice(new TransactionInterceptor(this, new AnnotationTransactionAttributeSource()));
        return (T) factory.getProxy();
    }

    /**
     * How the transactions opened so far ended, in order.
     *
     * @return {@code "commit"} or {@code "rollback"} for each of them
     */
    public List<String> outcomes() {
        return outcomes;
    }

    @Override
    public TransactionStatus getTransaction(TransactionDefinition definition) {
        return new SimpleTransactionStatus(true);
    }

    @Override
    public void commit(TransactionStatus status) {
        outcomes.add("commit");
    }

    @Override
    public void rollback(TransactionStatus status) {
        outcomes.add("rollback");
    }
}
