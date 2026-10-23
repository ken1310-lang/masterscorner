ALTER TABLE "master_class" DROP CONSTRAINT "master_class_fee_check", ADD CONSTRAINT "master_class_fee_check" CHECK ((
        ("fee_amount" is null and "fee_period" is null)
        or (
          "fee_amount" is not null
          and "fee_amount" > 0
          and "fee_period" is not null
        )
      ));