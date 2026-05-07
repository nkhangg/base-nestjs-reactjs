import { apiClient } from '@lib/api-client'
import type {
  ClassroomListResponse,
  ClassroomReportResponse,
  MemberListResponse,
  OrgListResponse,
  Organization,
  Classroom,
} from '../types'

export const organizationService = {
  async listOrgs(params?: { page?: number; limit?: number; search?: string }): Promise<OrgListResponse> {
    const { data } = await apiClient.get<OrgListResponse>('/admin/organizations', {
      params,
      withCredentials: true,
    })
    return data
  },

  async getOrg(id: string): Promise<Organization> {
    const { data } = await apiClient.get<Organization>(`/admin/organizations/${id}`, {
      withCredentials: true,
    })
    return data
  },

  async deleteOrg(id: string): Promise<void> {
    await apiClient.delete(`/admin/organizations/${id}`, { withCredentials: true })
  },

  async listClassrooms(orgId: string, params?: { page?: number; limit?: number }): Promise<ClassroomListResponse> {
    const { data } = await apiClient.get<ClassroomListResponse>(
      `/admin/organizations/${orgId}/classrooms`,
      { params, withCredentials: true },
    )
    return data
  },

  async getClassroom(id: string): Promise<Classroom> {
    const { data } = await apiClient.get<Classroom>(`/admin/classrooms/${id}`, {
      withCredentials: true,
    })
    return data
  },

  async listMembers(classroomId: string): Promise<MemberListResponse> {
    const { data } = await apiClient.get<MemberListResponse>(
      `/admin/classrooms/${classroomId}/members`,
      { withCredentials: true },
    )
    return data
  },

  async removeMember(classroomId: string, userId: string): Promise<void> {
    await apiClient.delete(`/admin/classrooms/${classroomId}/members/${userId}`, {
      withCredentials: true,
    })
  },

  async getClassroomReport(classroomId: string): Promise<ClassroomReportResponse> {
    const { data } = await apiClient.get<ClassroomReportResponse>(
      `/admin/classrooms/${classroomId}/report`,
      { withCredentials: true },
    )
    return data
  },
}
