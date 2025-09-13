module no_gas_labs::flashloan {
    use sui::tx_context::TxContext;
    use sui::event;
    use sui::object::{Self, UID};
    use sui::object;

    /// Flash loan pool with simple liquidity counter (placeholder for real liquidity mgmt)
    struct Pool has key {
        id: UID,
        liquidity: u64,
    }

    /// Linear ticket that must be consumed in the same transaction via `repay`.
    /// Not having the `drop` ability ensures atomicity: if the ticket is not
    /// consumed, the transaction will fail at the end of execution.
    struct LoanTicket { amount: u64 }

    struct LoanEvent has copy, drop { amount: u64, ok: bool }

    public entry fun init_pool(ctx: &mut TxContext): Pool {
        let id = object::new(ctx);
        Pool { id, liquidity: 1_000_000 }
    }

    /// Borrow emits a start event and returns a linear `LoanTicket` that must be
    /// consumed by `repay` within the same programmable transaction.
    public entry fun borrow(pool: &mut Pool, amount: u64, _ctx: &mut TxContext): LoanTicket {
        assert!(amount > 0 && amount <= pool.liquidity, 1);
        event::emit(LoanEvent { amount, ok: false });
        LoanTicket { amount }
    }

    /// Repay consumes the `LoanTicket` and emits the success event. Any failure
    /// in downstream calls will revert the entire transaction.
    public entry fun repay(_pool: &mut Pool, ticket: LoanTicket, _ctx: &mut TxContext) {
        let LoanTicket { amount } = ticket;
        event::emit(LoanEvent { amount, ok: true });
    }
}