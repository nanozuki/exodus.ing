export interface UserDomain {
  id: number;
  userId: string;
  domain: string;
  verifyTxtRecord: string;
  verifiedAt: Date | null;
}

export interface UserDomainInput {
  userId: string;
  domain: string;
  verifyTxtRecord: string;
}

export interface UserDomainPatch {
  verifiedAt: Date;
}

export interface UserDomainRepository {
  listByUserId(userId: string): Promise<UserDomain[]>;
  getUserDomain(userId: string, domain: string): Promise<UserDomain>;
  create(userDomain: UserDomainInput): Promise<UserDomain>;
  update(userId: string, domain: string, patch: Partial<UserDomainPatch>): Promise<UserDomain>;
  delete(userId: string, domain: string): Promise<void>;
}
