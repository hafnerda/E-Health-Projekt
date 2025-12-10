package services;

import model.Appointment;

import java.util.List;

public interface AppointmentService {

    List<Appointment> getAppointmentsForUserAndMonth(Long userId, int year, int month);

    Appointment createAppointment(Long userId, Appointment appointment);

    void cancelAppointment(Long userId, Long appointmentId);
}