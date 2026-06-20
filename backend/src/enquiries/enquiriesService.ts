import { NotFoundError, ValidationError, newId } from "../core";
import type { Clock, UUID } from "../core";
import { submitEnquirySchema } from "./types";
import type { Enquiry, SubmitEnquiryInput } from "./types";
import type { EnquiriesRepository } from "./enquiriesRepository";

export class EnquiriesService {
  constructor(
    private readonly repo: EnquiriesRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Anti-timewaster gate: an enquiry is only stored if the client has
   * explicitly confirmed they read the listing's services. Otherwise reject.
   */
  async submit(input: SubmitEnquiryInput): Promise<Enquiry> {
    const data = submitEnquirySchema.parse(input);
    if (data.confirmedReadServices !== true) {
      throw new ValidationError("must confirm read services");
    }

    const now = this.clock.now();
    const enquiry: Enquiry = {
      id: newId(),
      listingId: data.listingId,
      clientId: data.clientId,
      name: data.name,
      preferredTime: data.preferredTime,
      confirmedReadServices: true,
      references: data.references,
      message: data.message,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(enquiry);
  }

  async accept(enquiryId: UUID): Promise<Enquiry> {
    return this.transition(enquiryId, "accepted");
  }

  async decline(enquiryId: UUID): Promise<Enquiry> {
    return this.transition(enquiryId, "declined");
  }

  async listForListing(listingId: UUID): Promise<Enquiry[]> {
    return this.repo.findByListing(listingId);
  }

  private async transition(
    enquiryId: UUID,
    status: "accepted" | "declined",
  ): Promise<Enquiry> {
    const existing = await this.repo.getById(enquiryId);
    if (!existing) {
      throw new NotFoundError("Enquiry not found");
    }
    const updated: Enquiry = {
      ...existing,
      status,
      updatedAt: this.clock.now(),
    };
    return this.repo.save(updated);
  }
}
