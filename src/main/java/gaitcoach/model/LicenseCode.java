package gaitcoach.model;

import jakarta.persistence.*;

@Entity
@Table(name = "license_codes")
public class LicenseCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private boolean used = false;

    @OneToOne
    @JoinColumn(name = "used_by_id")
    private User usedBy;

    public LicenseCode() {
    }

    public LicenseCode(String code) {
        this.code = code;
    }

    // Getter / Setter

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }

    public User getUsedBy() {
        return usedBy;
    }

    public void setUsedBy(User usedBy) {
        this.usedBy = usedBy;
    }
}
