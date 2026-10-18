package com.school.auth.repository;

import com.school.auth.entity.FeatureToggle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureToggleRepository extends JpaRepository<FeatureToggle, Long> {

    List<FeatureToggle> findByRole(String role);

    Optional<FeatureToggle> findByRoleAndModuleKey(String role, String moduleKey);
}
