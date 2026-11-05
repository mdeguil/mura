package io.mura.admin;

import io.mura.member.AccountRole;
import io.mura.member.User;
import io.mura.member.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Gives an instance its administrator. A new install has no account at all,
 * and only an administrator can make another one, so the operator names the
 * address that should hold the role in {@code MURA_ADMIN_EMAIL}. The account
 * using that address becomes an administrator once the address is
 * confirmed, at the code or at a later sign-in, and only while the instance
 * has no active administrator: a stranger cannot claim the role without
 * receiving the code mailed to that address, and once an administrator
 * exists, the variable no longer overrides what they decide. If every
 * administrator is gone or suspended, the same address can take the role
 * back.
 */
@Component
public class FirstAdministrator {

    private static final Logger log = LoggerFactory.getLogger(FirstAdministrator.class);

    private final UserRepository userRepository;
    private final String designatedEmail;

    /**
     * A first administrator for the address the operator configured.
     *
     * @param userRepository where accounts and their roles are kept
     * @param designatedEmail the address from {@code mura.admin-email}, empty
     *        when the operator set none
     */
    public FirstAdministrator(
            UserRepository userRepository,
            @Value("${mura.admin-email:}") String designatedEmail
    ) {
        this.userRepository = userRepository;
        this.designatedEmail = designatedEmail == null ? "" : designatedEmail.trim();
    }

    /**
     * Makes the account an administrator if it is the designated one, its
     * address is confirmed and the instance has no active administrator.
     *
     * @param user an account that just confirmed its address or signed in
     * @return true if the account was made an administrator
     */
    public boolean promoteIfDesignated(User user) {
        if (designatedEmail.isEmpty()
                || !designatedEmail.equalsIgnoreCase(user.getEmail())
                || !user.isEmailVerified()
                || user.isSuspended()
                || user.getAccountRole() == AccountRole.ADMIN
                || userRepository.existsByAccountRoleAndSuspendedAtIsNull(AccountRole.ADMIN)) {
            return false;
        }
        user.setAccountRole(AccountRole.ADMIN);
        userRepository.save(user);
        log.info("{} is now an administrator: MURA_ADMIN_EMAIL names it and the instance had none.",
                user.getEmail());
        return true;
    }

    /** Once the backend has started, warns if the instance has no administrator. */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        warnIfNoAdministrator();
    }

    /**
     * Says in the log when the instance has no active administrator, and
     * what to do about it.
     *
     * @return true if a warning was logged
     */
    boolean warnIfNoAdministrator() {
        if (userRepository.existsByAccountRoleAndSuspendedAtIsNull(AccountRole.ADMIN)) {
            return false;
        }
        if (designatedEmail.isEmpty()) {
            log.warn("This instance has no administrator. Set MURA_ADMIN_EMAIL in .env to your address, "
                    + "restart the backend, then create the account with that address (or sign in with it).");
        } else {
            log.warn("This instance has no administrator yet. The account using {} will become one once "
                    + "its address is confirmed.", designatedEmail);
        }
        return true;
    }
}
