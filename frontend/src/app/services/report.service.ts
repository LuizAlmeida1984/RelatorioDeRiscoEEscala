import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnalyzePayload, AnalysisResponse, ReportPayload } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  analyze(payload: AnalyzePayload): Observable<AnalysisResponse> {
    return this.http.post<AnalysisResponse>(`${this.apiUrl}/analyze`, payload);
  }

  saveReport(payload: ReportPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reports`, payload);
  }

  getReports(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/reports`);
  }
}
