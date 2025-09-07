
 * HASIVU Platform Database Integration Tests;
 * Tests Prisma models, relationships, and data integrity;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
describe('Database Integration Tests', (
  });
  afterAll(async (
  });
  describe('User Model', (
      };
      const user = await prisma.user.create({}
      });
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.createdAt).toBeInstanceOf(Date);
    });
    test('should enforce unique email constraint', async (
        }
      });
      await expect(
        prisma.user.create({}
          }
        })
      ).rejects.toThrow(/Unique constraint failed/);
    });
    test('should validate required fields', async (
          }
        })
      ).rejects.toThrow();
    });
  });
  describe('School Model', (
      };
      const school = await prisma.school.create({}
      });
      expect(school.id).toBe(schoolData.id);
      expect(school.name).toBe(schoolData.name);
      expect(school.isActive).toBe(true);
    });
    test('should handle school-user relationship', async (
        }
      });
      const user = await prisma.user.create({}
        }
      });
      const schoolWithUsers = await prisma.school.findUnique({}
        where: { id: school.id },
        include: { users: true }
      });
      expect(schoolWithUsers.users).toHaveLength(1);
      expect(schoolWithUsers.users[0].id).toBe(user.id);
    });
  });
  describe('MenuItem Model', (
      };
      const menuItem = await prisma.menuItem.create({}
      });
      expect(menuItem.id).toBeDefined();
      expect(menuItem.price).toBe(menuItemData.price);
      expect(menuItem.allergens).toEqual(menuItemData.allergens);
      expect(menuItem.nutritionalValue.calories).toBe(menuItemData.calories);
    });
    test('should validate price constraints', async (
          }
        })
      ).rejects.toThrow();
    });
  });
  describe('Order Model', (
        }
      });
      testMenuItem = await prisma.menuItem.create({}
        }
      });
    });
    test('should create order with items', async (
              }
            ]
          }
        },
        include: {}
        }
      });
      expect(order.items).toHaveLength(1);
      expect(order.items[0].quantity).toBe(3);
      expect(order.totalAmount).toBe(1500);
    });
    test('should enforce order status constraints', async (
        }
      });
      // Valid status transition
      const updatedOrder = await prisma.order.update({}
        where: { id: order.id },
        data: { status: 'CONFIRMED' }
      });
      expect(updatedOrder.status).toBe('CONFIRMED');
    });
  });
  describe('Payment Model', (
        }
      });
      testOrder = await prisma.order.create({}
        }
      });
    });
    test('should create payment record', async (
        gatewayResponse: { success: true }
      };
      const payment = await prisma.payment.create({}
      });
      expect(payment.transactionId).toBe(paymentData.transactionId);
      expect(payment.amount).toBe(paymentData.amount);
      expect(payment.status).toBe('SUCCESS');
    });
    test('should handle failed payments', async (
        }
      });
      expect(failedPayment.status).toBe('FAILED');
      expect(failedPayment.failureReason).toBe('INSUFFICIENT_FUNDS');
    });
  });
  describe('RFID Card Model', (
        }
      });
    });
    test('should create RFID card', async (
      };
      const rfidCard = await prisma.rFIDCard.create({}
      });
      expect(rfidCard.cardId).toBe(rfidCardData.cardId);
      expect(rfidCard.userId).toBe(testUser.id);
      expect(rfidCard.isActive).toBe(true);
    });
    test('should enforce unique card ID constraint', async (
        }
      });
      // Create another user to test uniqueness
      const anotherUser = await prisma.user.create({}
        }
      });
      await expect(
        prisma.rFIDCard.create({}
          }
        })
      ).rejects.toThrow(/Unique constraint failed/);
    });
  });
  describe('Transaction Handling', (
            }
          });
          // Intentionally cause an error
          throw new Error('Transaction test error');
        });
      }
{}
      }
      // User should not exist due to rollback
      const user = await prisma.user.findUnique({}
        where: { id: userId }
      });
      expect(user).toBeNull();
    });
    test('should commit successful transactions', async (
          }
        });
        userId = user.id;
        await tx.rFIDCard.create({}
          }
        });
      });
      // Both user and RFID card should exist
      const user = await prisma.user.findUnique({}
        where: { id: userId },
        include: { rfidCards: true }
      });
      expect(user).toBeTruthy();
      expect(user.rfidCards).toHaveLength(1);
    });
  });
});
// Helper functions
async
    where: { id: 'test-school-1' },
    update: {},
    create: {}
    }
  });
}
async
    where: { user: { email: { contains: '@example.com' } } }
  });
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({}
    where: { user: { email: { contains: '@example.com' } } }
  });
  await prisma.rFIDCard.deleteMany({}
    where: { user: { email: { contains: '@example.com' } } }
  });
  await prisma.menuItem.deleteMany({}
    where: { name: { contains: 'Test' } }
  });
  await prisma.user.deleteMany({}
    where: { email: { contains: '@example.com' } }
  });
  await prisma.school.deleteMany({}
        { name: { contains: 'Test' } },
        { id: { startsWith: 'test-school' } }
      ]
    }
  });
}