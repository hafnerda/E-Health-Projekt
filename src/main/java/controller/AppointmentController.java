package controller;

import model.Appointment;
import services.AppointmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/appointments")
@CrossOrigin
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<Appointment> getAppointmentsForMonth(
            @PathVariable Long userId,
            @RequestParam int year,
            @RequestParam int month) {
        return appointmentService.getAppointmentsForUserAndMonth(userId, year, month);
    }

    @PostMapping
    public Appointment createAppointment(
            @PathVariable Long userId,
            @RequestBody Appointment appointment) {
        return appointmentService.createAppointment(userId, appointment);
    }

    @PostMapping("/{appointmentId}/cancel")
    public void cancelAppointment(
            @PathVariable Long userId,
            @PathVariable Long appointmentId) {
        appointmentService.cancelAppointment(userId, appointmentId);
    }
}