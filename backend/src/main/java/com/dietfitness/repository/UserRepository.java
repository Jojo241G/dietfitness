package com.dietfitness.repository;

import com.dietfitness.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByTokenConfirmation(String token);
    boolean existsByEmail(String email);
}
