import { Component, NgZone, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AmountDocument } from '../../interfaces/AmountDocument.interface';

@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.scss']
})
export class PlotComponent implements OnInit {
  public options = {};
  private unsubscribe: () => void;

  constructor(
    public auth: AngularFireAuth,
    private db: AngularFirestore,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    //when a user is authenticated
    this.auth.onAuthStateChanged((user) => {
      if (!user && !this.unsubscribe) return;

      if (!user && this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
        return;
      }
      //get the documents with the amounts of the current user
      this.db.collection<AmountDocument>(`users/${user.uid}/amounts`, (ref) => {
        const result = ref.orderBy('date');
        //remember the unsubscribe method, and get all amounts for this user
        this.unsubscribe = result.onSnapshot((snapshot) => {
          console.info('Hey! Snapshot received! 😃');

          if (snapshot.metadata.hasPendingWrites) {
            return console.log('Writes pending, ignoring snapshot! ✍🏻');
          }

          this.ngZone.run(() => {
            const d = snapshot.docs
              .slice(-30)
              .sort((a, b) => a.get('date') - b.get('date'))
              .reduce(
                (t, doc) => {
                  t.x.push(doc.get('date').toDate().toLocaleDateString());
                  t.y.push(doc.get('amount'));
                  return t;
                },
                { x: [], y: [] }
              );

            this.options = {
              tooltip: {},
              xAxis: {
                data: d.x,
                silent: false,
                splitLine: {
                  show: false
                }
              },
              yAxis: {},
              series: [
                {
                  name: 'Amounts left',
                  type: 'line',
                  data: d.y,
                  animationDelay: (idx: number) => idx * 10
                }
              ],
              animationEasing: 'elasticOut',
              animationDelayUpdate: (idx: number) => idx * 5
            };
          });
        });
        return result;
      });
    });
  }
}
