import type { Clock, Db } from "../core";
import { systemClock, sha256Hasher } from "../core";
import {
  fakePaymentProvider,
  fakeIdVerificationProvider,
  fakeModerationProvider,
  inMemoryEventBus,
} from "../core/testing";

import { AccountsService, InMemoryAccountsRepository, PgAccountsRepository } from "../accounts";
import { ListingsService, InMemoryListingsRepository, PgListingsRepository } from "../listings";
import {
  PlansService,
  SubscriptionsService,
  PlacementsService,
  InMemoryPlansRepository,
  InMemorySubscriptionsRepository,
  InMemoryPlacementsRepository,
  PgPlansRepository,
  PgSubscriptionsRepository,
  PgPlacementsRepository,
} from "../monetization";
import { VerificationService, InMemoryVerificationRepository, PgVerificationRepository } from "../verification";
import { PaymentsService, InMemoryPaymentsRepository, PgPaymentsRepository } from "../payments";
import { GeoService, InMemoryGeoRepository, PgGeoRepository } from "../geo";
import { ClientsService, InMemoryClientsRepository, PgClientsRepository } from "../clients";
import {
  ScreeningService,
  ReverseCheckerService,
  InMemoryScreeningRepository,
  InMemoryOffenderReportRepository,
  PgScreeningRepository,
  PgOffenderReportRepository,
} from "../screening";
import {
  BadDateService,
  ReverseReviewService,
  TrustedContactService,
  CheckInService,
  InMemoryBadDateRepository,
  InMemoryReverseReviewRepository,
  InMemoryTrustedContactRepository,
  InMemoryCheckInRepository,
  PgBadDateRepository,
  PgReverseReviewRepository,
  PgTrustedContactRepository,
  PgCheckInRepository,
} from "../safety";
import { EnquiriesService, InMemoryEnquiriesRepository, PgEnquiriesRepository } from "../enquiries";
import { DepositsService, InMemoryDepositsRepository, PgDepositsRepository } from "../deposits";
import { ReviewsService, InMemoryReviewsRepository, PgReviewsRepository } from "../reviews";
import { AnalyticsService, InMemoryAnalyticsRepository, PgAnalyticsRepository } from "../analytics";
import {
  ReferralsService,
  InMemoryReferralCodeRepository,
  InMemoryReferralRepository,
  InMemoryRewardLedgerRepository,
  PgReferralCodeRepository,
  PgReferralRepository,
  PgRewardLedgerRepository,
} from "../referrals";
import {
  ModerationService,
  InMemoryModerationRepository,
  PgModerationRepository,
} from "../moderation";
import {
  MessagingService,
  InMemoryConversationRepository,
  InMemoryMessageRepository,
  PgConversationRepository,
  PgMessageRepository,
} from "../messaging";

import {
  placeholderPaymentProvider,
  placeholderIdVerificationProvider,
  productionModerationProvider,
  inProcessEventBus,
} from "./providers";

/**
 * Composition root. Every domain service assembled from its repositories,
 * ports, and a shared Clock. The HTTP layer depends only on this interface.
 */
export interface Container {
  accountsService: AccountsService;
  listingsService: ListingsService;
  plansService: PlansService;
  subscriptionsService: SubscriptionsService;
  placementsService: PlacementsService;
  verificationService: VerificationService;
  paymentsService: PaymentsService;
  geoService: GeoService;
  clientsService: ClientsService;
  screeningService: ScreeningService;
  reverseCheckerService: ReverseCheckerService;
  badDateService: BadDateService;
  reverseReviewService: ReverseReviewService;
  trustedContactService: TrustedContactService;
  checkInService: CheckInService;
  enquiriesService: EnquiriesService;
  depositsService: DepositsService;
  reviewsService: ReviewsService;
  analyticsService: AnalyticsService;
  referralsService: ReferralsService;
  moderationService: ModerationService;
  messagingService: MessagingService;
  clock: Clock;
}

/**
 * Wires every service with in-memory repositories and core/testing fakes.
 * No database. Seeds reference data (plans, cities) so the container is usable
 * out of the box. Pass a fixed clock for deterministic tests.
 */
export function createInMemoryContainer(opts?: { clock?: Clock }): Container {
  const clock = opts?.clock ?? systemClock;
  const paymentProvider = fakePaymentProvider();
  const idProvider = fakeIdVerificationProvider();
  const eventBus = inMemoryEventBus();

  const plansRepo = new InMemoryPlansRepository();
  const plansService = new PlansService(plansRepo);
  const geoRepo = new InMemoryGeoRepository();
  const geoService = new GeoService(geoRepo);

  const moderationService = new ModerationService(
    new InMemoryModerationRepository(),
    fakeModerationProvider(),
    clock,
    eventBus,
  );
  const messagingService = new MessagingService(
    new InMemoryConversationRepository(),
    new InMemoryMessageRepository(),
    moderationService,
    clock,
    eventBus,
  );

  const container: Container = {
    accountsService: new AccountsService(new InMemoryAccountsRepository(), clock),
    listingsService: new ListingsService(new InMemoryListingsRepository(), clock),
    plansService,
    subscriptionsService: new SubscriptionsService(
      new InMemorySubscriptionsRepository(),
      plansRepo,
      clock,
    ),
    placementsService: new PlacementsService(new InMemoryPlacementsRepository(), clock),
    verificationService: new VerificationService(
      new InMemoryVerificationRepository(),
      idProvider,
      clock,
    ),
    paymentsService: new PaymentsService(new InMemoryPaymentsRepository(), paymentProvider, clock),
    geoService,
    clientsService: new ClientsService(new InMemoryClientsRepository(), clock),
    screeningService: new ScreeningService(new InMemoryScreeningRepository(), clock),
    reverseCheckerService: new ReverseCheckerService(
      new InMemoryOffenderReportRepository(),
      sha256Hasher,
      clock,
    ),
    badDateService: new BadDateService(new InMemoryBadDateRepository(), sha256Hasher, clock),
    reverseReviewService: new ReverseReviewService(
      new InMemoryReverseReviewRepository(),
      sha256Hasher,
      clock,
    ),
    trustedContactService: new TrustedContactService(
      new InMemoryTrustedContactRepository(),
      sha256Hasher,
      clock,
    ),
    checkInService: new CheckInService(new InMemoryCheckInRepository(), clock, eventBus),
    enquiriesService: new EnquiriesService(new InMemoryEnquiriesRepository(), clock),
    depositsService: new DepositsService(new InMemoryDepositsRepository(), paymentProvider, clock),
    reviewsService: new ReviewsService(new InMemoryReviewsRepository(), clock),
    analyticsService: new AnalyticsService(new InMemoryAnalyticsRepository(), clock),
    referralsService: new ReferralsService(
      new InMemoryReferralCodeRepository(),
      new InMemoryReferralRepository(),
      new InMemoryRewardLedgerRepository(),
      clock,
    ),
    moderationService,
    messagingService,
    clock,
  };

  void plansService.seed();
  void geoService.seed();

  eventBus.subscribe("message.sent", (p) => {
    // Tier-2 runs off the hot path; never let its failure crash the process.
    void container.moderationService.screenDeep(p as any).catch((err: unknown) => {
      console.error("[moderation] Tier-2 screenDeep failed", err);
    });
  });

  return container;
}

/**
 * Wires every service with pg repositories (sharing the given Db), the
 * production placeholder providers, and the in-process event bus.
 */
export function createPgContainer(db: Db, opts?: { clock?: Clock }): Container {
  const clock = opts?.clock ?? systemClock;
  const paymentProvider = placeholderPaymentProvider();
  const idProvider = placeholderIdVerificationProvider();
  const eventBus = inProcessEventBus();

  const plansRepo = new PgPlansRepository(db);

  const moderationService = new ModerationService(
    new PgModerationRepository(db),
    productionModerationProvider(),
    clock,
    eventBus,
  );
  const messagingService = new MessagingService(
    new PgConversationRepository(db),
    new PgMessageRepository(db),
    moderationService,
    clock,
    eventBus,
  );

  const container: Container = {
    accountsService: new AccountsService(new PgAccountsRepository(db), clock),
    listingsService: new ListingsService(new PgListingsRepository(db), clock),
    plansService: new PlansService(plansRepo),
    subscriptionsService: new SubscriptionsService(
      new PgSubscriptionsRepository(db),
      plansRepo,
      clock,
    ),
    placementsService: new PlacementsService(new PgPlacementsRepository(db), clock),
    verificationService: new VerificationService(new PgVerificationRepository(db), idProvider, clock),
    paymentsService: new PaymentsService(new PgPaymentsRepository(db), paymentProvider, clock),
    geoService: new GeoService(new PgGeoRepository(db)),
    clientsService: new ClientsService(new PgClientsRepository(db), clock),
    screeningService: new ScreeningService(new PgScreeningRepository(db), clock),
    reverseCheckerService: new ReverseCheckerService(
      new PgOffenderReportRepository(db),
      sha256Hasher,
      clock,
    ),
    badDateService: new BadDateService(new PgBadDateRepository(db), sha256Hasher, clock),
    reverseReviewService: new ReverseReviewService(
      new PgReverseReviewRepository(db),
      sha256Hasher,
      clock,
    ),
    trustedContactService: new TrustedContactService(
      new PgTrustedContactRepository(db),
      sha256Hasher,
      clock,
    ),
    checkInService: new CheckInService(new PgCheckInRepository(db), clock, eventBus),
    enquiriesService: new EnquiriesService(new PgEnquiriesRepository(db), clock),
    depositsService: new DepositsService(new PgDepositsRepository(db), paymentProvider, clock),
    reviewsService: new ReviewsService(new PgReviewsRepository(db), clock),
    analyticsService: new AnalyticsService(new PgAnalyticsRepository(db), clock),
    referralsService: new ReferralsService(
      new PgReferralCodeRepository(db),
      new PgReferralRepository(db),
      new PgRewardLedgerRepository(db),
      clock,
    ),
    moderationService,
    messagingService,
    clock,
  };

  eventBus.subscribe("message.sent", (p) => {
    // Tier-2 runs off the hot path; never let its failure crash the process.
    void container.moderationService.screenDeep(p as any).catch((err: unknown) => {
      console.error("[moderation] Tier-2 screenDeep failed", err);
    });
  });

  return container;
}
