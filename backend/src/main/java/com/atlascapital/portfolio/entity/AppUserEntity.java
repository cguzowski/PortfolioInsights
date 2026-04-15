package com.atlascapital.portfolio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_user")
public class AppUserEntity {

    @Id
    private Long id;

    @Column(nullable = false, length = 60, unique = true)
    private String username;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getFullName() {
        return fullName;
    }
}
