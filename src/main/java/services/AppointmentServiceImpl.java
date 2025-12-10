package services;

import model.Appointment;
import model.User;
import repository.AppointmentRepository;
import repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
            UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<Appointment> getAppointmentsForUserAndMonth(Long userId, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.atEndOfMonth().atTime(23, 59, 59);
        return appointmentRepository.findByUserIdAndStartTimeBetween(userId, from, to);
    }

    @Override
    public Appointment createAppointment(Long userId, Appointment appointment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        appointment.setUser(user);
        return appointmentRepository.save(appointment);
    }

    @Override
    public void cancelAppointment(Long userId, Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        if (!appt.getUser().getId().equals(userId)) {
            throw new IllegalStateException("User not allowed to cancel this appointment");
        }

        appt.setCancelled(true);
        appointmentRepository.save(appt);
    }
}