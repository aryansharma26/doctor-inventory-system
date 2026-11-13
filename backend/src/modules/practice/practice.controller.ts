import type { Request, RequestHandler } from "express";
import { PracticeService } from "./practice.service.js";

const service = new PracticeService();
const actor = (req: Request) => ({
  clinicId: req.auth!.clinicId!,
  userId: req.auth!.userId,
  requestId: req.requestId
});

export const listDoctors: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await service.listDoctors(req.auth!.clinicId!) });
};

export const listAppointments: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await service.listAppointments(req.auth!.clinicId!, req.query as never) });
};

export const createAppointment: RequestHandler = async (req, res) => {
  res.status(201).json({ success: true, data: await service.createAppointment(actor(req), req.body) });
};

export const updateAppointmentStatus: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.updateAppointmentStatus(actor(req), String(req.params.id), req.body.status, req.body.notes)
  });
};

export const getPatientRecord: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.getPatientRecord(req.auth!.clinicId!, String(req.params.patientId))
  });
};

export const createPatientNote: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createPatientNote(actor(req), String(req.params.patientId), req.body)
  });
};

export const updatePatientProfile: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.updatePatientProfile(actor(req), String(req.params.patientId), req.body)
  });
};

export const createMedicalHistory: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createMedicalHistory(actor(req), String(req.params.patientId), req.body)
  });
};

export const createAllergy: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createAllergy(actor(req), String(req.params.patientId), req.body)
  });
};

export const createVital: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createVital(actor(req), String(req.params.patientId), req.body)
  });
};

export const createDiagnosis: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createDiagnosis(actor(req), String(req.params.patientId), req.body)
  });
};

export const createLabReport: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createLabReport(actor(req), String(req.params.patientId), req.body)
  });
};

export const createVaccination: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createVaccination(actor(req), String(req.params.patientId), req.body)
  });
};

export const createInsurance: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createInsurance(actor(req), String(req.params.patientId), req.body)
  });
};

export const createFollowUp: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createFollowUp(actor(req), String(req.params.patientId), req.body)
  });
};

export const updateFollowUpStatus: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.updateFollowUpStatus(
      actor(req),
      String(req.params.patientId),
      String(req.params.id),
      req.body
    )
  });
};

export const createPayment: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createPayment(actor(req), String(req.params.patientId), req.body)
  });
};

export const getAppointmentEncounter: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.getAppointmentEncounter(req.auth!.clinicId!, String(req.params.id))
  });
};

export const updateAppointmentClinical: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.updateAppointmentClinical(actor(req), String(req.params.id), req.body)
  });
};

export const createAppointmentInvoice: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createAppointmentInvoice(actor(req), String(req.params.id), req.body)
  });
};

export const getDoctorProfile: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.getDoctorProfile(req.auth!.clinicId!, String(req.params.doctorMembershipId))
  });
};

export const updateDoctorAvailability: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.updateDoctorAvailability(
      actor(req),
      String(req.params.doctorMembershipId),
      req.body
    )
  });
};

export const createDoctorTimeOff: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await service.createDoctorTimeOff(
      actor(req),
      String(req.params.doctorMembershipId),
      req.body
    )
  });
};

export const listPrescriptions: RequestHandler = async (req, res) => {
  const result = await service.listPrescriptions(req.auth!.clinicId!, req.query as never);
  res.json({
    success: true,
    data: result.rows,
    meta: {
      page: Number(req.query.page),
      pageSize: Number(req.query.pageSize),
      total: result.total,
      totalPages: Math.ceil(result.total / Number(req.query.pageSize))
    }
  });
};

export const createPrescription: RequestHandler = async (req, res) => {
  res.status(201).json({ success: true, data: await service.createPrescription(actor(req), req.body) });
};

export const updatePrescriptionStatus: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await service.updatePrescriptionStatus(actor(req), String(req.params.id), req.body.status)
  });
};
