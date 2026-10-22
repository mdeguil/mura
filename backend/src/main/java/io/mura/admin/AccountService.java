package io.mura.admin;

import io.mura.admin.dto.ChangeAccountRoleRequest;
import io.mura.common.exception.ApiException;
import io.mura.member.AccountRole;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.member.dto.AccountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AccountResponse> list(UUID actorId) {
        requireAdmin(actorId);
        return userRepository.findAll().stream()
                // Administrators first, then alphabetically: the short list
                // of people who can change things is the one worth seeing.
                .sorted(Comparator
                        .comparing((User u) -> u.getAccountRole() == AccountRole.ADMIN ? 0 : 1)
                        .thenComparing(u -> u.getUsername().toLowerCase()))
                .map(AccountResponse::from)
                .toList();
    }

    @Transactional
    public AccountResponse changeRole(UUID actorId, UUID targetId, ChangeAccountRoleRequest request) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);

        AccountRole role = request.accountRole();
        if (target.getAccountRole() == role) {
            return AccountResponse.from(target);
        }
        if (role == AccountRole.USER) {
            refuseLosingTheLastAdmin(target);
        }

        target.setAccountRole(role);
        return AccountResponse.from(target);
    }

    @Transactional
    public AccountResponse setSuspended(UUID actorId, UUID targetId, boolean suspended) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);
        refuseActingOnSelf(actorId, targetId, "Tu ne peux pas suspendre ton propre compte.");

        if (suspended && target.isSuspended()) {
            return AccountResponse.from(target);
        }
        if (suspended) {
            refuseLosingTheLastAdmin(target);
        }

        target.setSuspendedAt(suspended ? Instant.now() : null);
        return AccountResponse.from(target);
    }

    private void requireAdmin(UUID actorId) {
        if (!requireAccount(actorId).getAccountRole().administers()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette page est réservée aux administrateurs.");
        }
    }

    private User requireAccount(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ce compte n'existe pas."));
    }

    // Only suspension. Stepping down from the role is a normal thing to
    // want -- it is how you hand over -- and the last-administrator guard
    // already stops it from emptying the room. Suspending yourself has no
    // such legitimate use: it locks you out on the spot, and only someone
    // else can undo it.
    private void refuseActingOnSelf(UUID actorId, UUID targetId, String message) {
        if (actorId.equals(targetId)) {
            throw new ApiException(HttpStatus.CONFLICT, message);
        }
    }

    // Nobody may remove the last way back in. Suspending an administrator
    // counts as removing one: a suspended account cannot sign in.
    private void refuseLosingTheLastAdmin(User target) {
        if (target.getAccountRole() != AccountRole.ADMIN) {
            return;
        }
        long remaining = userRepository.findAll().stream()
                .filter(u -> u.getAccountRole() == AccountRole.ADMIN)
                .filter(u -> !u.isSuspended())
                .filter(u -> !u.getId().equals(target.getId()))
                .count();
        if (remaining == 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "C'est le dernier administrateur actif. Nomme quelqu'un d'autre avant."
            );
        }
    }
}
